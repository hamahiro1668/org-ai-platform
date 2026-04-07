interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key || !/^[\x20-\x7E]+$/.test(key)) {
    throw new Error('VITE_GROQ_API_KEY が設定されていません。.env.local を確認してください。');
  }
  return key;
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
  const apiKey = getApiKey();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq APIエラー (${response.status}): ${errText}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

export async function callClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  messages: Message[] = []
): Promise<T> {
  const apiKey = getApiKey();

  // response_format: json_object でモデルに有効な JSON のみを返させる
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq APIエラー (${response.status}): ${errText}`);
  }

  const data: GroqResponse = await response.json();
  const choice = data.choices[0];

  if (choice.finish_reason === 'length') {
    throw new Error(
      'AIの出力がトークン上限に達しました。タスクをより小さく分割するか、内容を絞ってください。'
    );
  }

  const raw = choice?.message?.content ?? '';

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
