interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason?: string;
  }>;
}

import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { humanizeTaskManagerError } from '../../utils/humanizeLlmError';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
/** 70B は on_demand の TPM を早く使い切るため、タスクマネージャー既定は 8B。70B 優先は VITE_GROQ_USE_LLAMA_70B=true */
const GROQ_MODEL_PRIMARY = 'llama-3.3-70b-versatile';
const GROQ_MODEL_FALLBACK = 'llama-3.1-8b-instant';
const GROQ_MAX_ATTEMPTS = 8;

function getDefaultGroqModel(): string {
  return import.meta.env.VITE_GROQ_USE_LLAMA_70B === 'true'
    ? GROQ_MODEL_PRIMARY
    : GROQ_MODEL_FALLBACK;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 429 時の待機秒: Retry-After ヘッダ優先、その後本文の Please try again / try again in Xs */
function parse429WaitSeconds(errBody: string, res: Response): number | null {
  const ra = res.headers.get('retry-after');
  if (ra) {
    const sec = parseInt(ra, 10);
    if (!Number.isNaN(sec) && sec >= 0) {
      return Math.min(sec, 120);
    }
  }
  const inText = (text: string): number | null => {
    const m = text.match(/(?:please\s+)?try\s+again\s+in\s+(\d+(?:\.\d+)?)\s*s/i);
    if (m) return Math.min(parseFloat(m[1]), 120);
    return null;
  };
  const fromBody = inText(errBody);
  if (fromBody !== null) return fromBody;
  try {
    const j = JSON.parse(errBody) as { error?: { message?: string } };
    return inText(j.error?.message ?? '');
  } catch {
    return null;
  }
}

/**
 * Groq Chat Completions。429 TPM 時は API が示す秒数だけ待って再試行し、
 * それでも失敗する場合は 8B モデルに切り替える。
 */
async function postGroqChatCompletions(
  apiKey: string,
  body: {
    model?: string;
    max_tokens: number;
    messages: Message[];
    response_format?: { type: 'json_object' };
  }
): Promise<GroqResponse> {
  let model = body.model ?? getDefaultGroqModel();
  let lastStatus = 0;
  let lastBody = '';

  for (let attempt = 0; attempt < GROQ_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...body,
        model,
      }),
    });

    if (res.ok) {
      return (await res.json()) as GroqResponse;
    }

    lastStatus = res.status;
    lastBody = await res.text();

    if (res.status === 429) {
      const waitSec = parse429WaitSeconds(lastBody, res);
      // 70B が TPM 超過のときは数十秒待つより、まず 8B を試す（別枠で通ることが多い）
      if (model === GROQ_MODEL_PRIMARY) {
        model = GROQ_MODEL_FALLBACK;
        continue;
      }
      if (waitSec !== null && waitSec > 0) {
        await delay(Math.min((waitSec + 0.35) * 1000, 125_000));
        continue;
      }
      await delay(5000);
      continue;
    }

    throw new Error(`Groq APIエラー (${lastStatus}): ${lastBody}`);
  }

  throw new Error(
    `Groq APIエラー (${lastStatus}): レート制限のため再試行上限に達しました。しばらく待ってから再度お試しください。 ${lastBody.slice(0, 500)}`
  );
}

/** ログイン時は既定で API ゲートウェイ→ai-engine 経由（ブラウザとサーバで Groq を二重に叩かない） */
function llmPreferGateway(): boolean {
  if (import.meta.env.VITE_LLM_DIRECT_GROQ === 'true') return false;
  return Boolean(useAuthStore.getState().token);
}

function getApiKeyOptional(): string | null {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || !/^[\x20-\x7E]+$/.test(key)) return null;
  return key;
}

function getApiKey(): string {
  const key = getApiKeyOptional();
  if (!key) {
    throw new Error(
      'VITE_GROQ_API_KEY が設定されていません。.env.local を確認するか、ログインして API 経由の LLM を利用してください。'
    );
  }
  return key;
}

async function completeLlm(
  messages: Message[],
  jsonMode: boolean
): Promise<{ raw: string; finishReason: string | undefined }> {
  let gatewayError: unknown = null;
  if (llmPreferGateway()) {
    try {
      const { data } = await api.post<{ success: boolean; data?: { content: string } }>('/llm/chat', {
        messages,
        jsonMode,
      });
      if (data.success && data.data && typeof data.data.content === 'string') {
        return { raw: data.data.content, finishReason: undefined };
      }
      gatewayError = new Error('LLM gateway returned empty or invalid response');
    } catch (e) {
      gatewayError = e;
      console.warn('[taskmanager/llm] gateway failed, falling back to direct Groq if configured', e);
    }
  }

  const directKey = getApiKeyOptional();
  if (!directKey && gatewayError) {
    throw new Error(humanizeTaskManagerError(gatewayError));
  }

  const apiKey = directKey ?? getApiKey();
  const groqData = await postGroqChatCompletions(apiKey, {
    model: getDefaultGroqModel(),
    max_tokens: 3072,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    messages,
  });
  const choice = groqData.choices[0];
  return {
    raw: choice?.message?.content ?? '',
    finishReason: choice?.finish_reason,
  };
}

/**
 * コードフェンスを除去しつつ、文字列の先頭から最初の JSON オブジェクト/配列を抽出する。
 * モデルが説明文や前置きを付けた場合でも正しく JSON 部分だけを取り出せる。
 */
function extractJson(raw: string): string {
  // コードフェンスを除去
  let s = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // JSON オブジェクト({)または配列([)の開始位置を探す
  const objIdx = s.indexOf('{');
  const arrIdx = s.indexOf('[');
  if (objIdx === -1 && arrIdx === -1) return s;

  const startIdx =
    objIdx === -1 ? arrIdx : arrIdx === -1 ? objIdx : Math.min(objIdx, arrIdx);
  s = s.slice(startIdx);

  // 対応する閉じ括弧を探す（文字列リテラル・エスケープを考慮）
  const openChar = s[0] as '{' | '[';
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inStr) { escaped = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === openChar) depth++;
    else if (c === closeChar && --depth === 0) return s.slice(0, i + 1);
  }

  // 末尾が切れていた場合は取れた分だけ返す
  return s;
}

/**
 * JSON 文字列値の中に含まれるリテラル制御文字（改行・タブ等）をエスケープする。
 * モデルが \n ではなく実際の改行を出力した場合の修復用。
 */
function repairJson(s: string): string {
  let out = '';
  let inStr = false;
  let escaped = false;
  for (const c of s) {
    if (escaped) { out += c; escaped = false; continue; }
    if (c === '\\' && inStr) { out += c; escaped = true; continue; }
    if (c === '"') { inStr = !inStr; out += c; continue; }
    if (inStr) {
      if (c === '\n') { out += '\\n'; continue; }
      if (c === '\r') { out += '\\r'; continue; }
      if (c === '\t') { out += '\\t'; continue; }
    }
    out += c;
  }
  return out;
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  messages: Message[] = []
): Promise<string> {
  const built: Message[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
    { role: 'user', content: userMessage },
  ];
  const { raw } = await completeLlm(built, false);
  return raw;
}

export async function callClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  messages: Message[] = []
): Promise<T> {
  const built: Message[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
    { role: 'user', content: userMessage },
  ];
  const { raw, finishReason } = await completeLlm(built, true);

  if (finishReason === 'length') {
    throw new Error(
      'AIの出力がトークン上限に達しました。タスクをより小さく分割するか、内容を絞ってください。'
    );
  }

  // Stage 1: そのままパース（json_object モードなら通常これで成功）
  try {
    return JSON.parse(raw) as T;
  } catch {
    // intentionally empty
  }

  // Stage 2: JSON 抽出 + 修復してパース
  try {
    return JSON.parse(repairJson(extractJson(raw))) as T;
  } catch {
    // intentionally empty
  }

  // Stage 3: AI に純粋な JSON を再出力させる（通常の callClaude を使用）
  const fixed = await callClaude(
    systemPrompt,
    `前の出力をJSONとしてパースしようとしましたが失敗しました。純粋なJSONのみで再度出力してください。コードフェンス・説明文は不要です。\n\n前の出力:\n${raw}`,
    messages
  );
  return JSON.parse(repairJson(extractJson(fixed))) as T;
}
