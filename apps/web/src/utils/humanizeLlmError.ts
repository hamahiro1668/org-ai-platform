import axios from 'axios';

/**
 * タスクマネージャー / LLM 周りのエラーをユーザー向けの短文＋次の一手に変換する。
 */
export function humanizeTaskManagerError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { error?: { message?: string; code?: string }; success?: boolean }
      | undefined;
    const code = data?.error?.code;
    const msg = data?.error?.message ?? err.message;

    if (status === 502 || code === 'AI_ENGINE_UNAVAILABLE') {
      return [
        'AI エンジンに接続できませんでした。',
        'api-gateway の AI_ENGINE_URL と、ai-engine の起動・GROQ_API_KEY を確認してください。',
      ].join('\n');
    }
    if (code === 'LLM_UPSTREAM_ERROR' || status === 503) {
      return [
        'AI 処理でサーバー側エラーが発生しました。',
        'しばらく待って再試行するか、管理者に Groq の利用状況（TPM）を確認してもらってください。',
        msg ? `詳細: ${msg.slice(0, 200)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
    if (status === 429 || /rate limit|429|TPM/i.test(String(msg))) {
      return [
        'AI の利用上限（レート制限）に達しています。',
        '1分ほど待ってから「再試行」するか、連続する大きなタスクを避けてください。',
      ].join('\n');
    }
    if (status === 401) {
      return 'ログインの有効期限が切れた可能性があります。再度ログインしてください。';
    }
    return msg || '通信エラーが発生しました。ネットワークを確認してください。';
  }

  if (err instanceof Error) {
    const m = err.message;
    if (/429|rate limit|TPM|レート制限/i.test(m)) {
      return [
        'AI の利用上限に達しました。',
        '数十秒〜1分待ってから再試行するか、タスクを小さく分けてください。',
      ].join('\n');
    }
    if (/VITE_GROQ_API_KEY|ログインして API/.test(m)) {
      return m;
    }
    if (/Groq APIエラー/.test(m)) {
      return [
        m.split('\n')[0],
        '',
        'ヒント: ログイン済みならサーバー（ai-engine）経由で呼び出されます。ブラウザ用キーはフォールバック用です。',
      ].join('\n');
    }
    return m;
  }

  return '予期しないエラーが発生しました。';
}
