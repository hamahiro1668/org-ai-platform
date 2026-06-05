#!/usr/bin/env node
// n8n が利用可能な状態かを 1 コマンドで診断する。
//
//   node scripts/n8n-status.mjs

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

function loadEnv(p) {
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}
loadEnv(join(ROOT, '.env'));

const N8N_URL = (process.env.N8N_CLOUD_URL ?? process.env.N8N_URL ?? '').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';
const TOKEN = process.env.N8N_WEBHOOK_AUTH_TOKEN ?? '';

const OK = '\x1b[32m✓\x1b[0m';
const NG = '\x1b[31m×\x1b[0m';
const WARN = '\x1b[33m!\x1b[0m';

function line(symbol, label, detail = '') {
  console.log(`  ${symbol} ${label}${detail ? '  ' + detail : ''}`);
}

console.log(`\nn8n 状態診断 (URL: ${N8N_URL || '未設定'})\n`);

if (!N8N_URL) {
  console.error('N8N_URL もしくは N8N_CLOUD_URL を .env に設定してください。');
  process.exit(1);
}

// 1. プロセス到達性
try {
  const res = await fetch(`${N8N_URL}/healthz`, { signal: AbortSignal.timeout(30000) });
  if (res.ok) line(OK, 'プロセス起動 (/healthz 200)');
  else line(NG, 'プロセス未起動', `${res.status}`);
} catch (e) {
  line(NG, 'ネットワーク到達不可', e.message);
  process.exit(2);
}

// 2. DB 接続
let dbOk = false;
try {
  const res = await fetch(`${N8N_URL}/api/v1/workflows`, { signal: AbortSignal.timeout(30000) });
  const body = await res.text();
  if (res.status === 503 && body.includes('Database is not ready')) {
    line(NG, 'DB 未接続', '"Database is not ready"');
  } else if (res.status === 401) {
    line(OK, 'DB 接続済み (Public API 認証必須)');
    dbOk = true;
  } else if (res.status === 404) {
    line(WARN, 'Public API パス無し', 'N8N_PUBLIC_API_DISABLED=false を確認');
  } else if (res.ok) {
    line(OK, 'DB 接続済み (Public API 認証なし応答)');
    dbOk = true;
  } else {
    line(WARN, `DB 状態不明`, `${res.status} ${body.slice(0, 80)}`);
  }
} catch (e) {
  line(NG, 'DB チェック失敗', e.message);
}

// 3. API キー
if (!N8N_API_KEY) {
  line(WARN, 'N8N_API_KEY 未設定', 'インポートに必要');
} else if (dbOk) {
  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const j = await res.json();
      line(OK, 'API キー有効', `workflows: ${j.data?.length ?? 0} 件`);
    } else if (res.status === 401) {
      line(NG, 'API キー無効 (401)', `→ ${N8N_URL}/settings/api で再発行`);
    } else {
      line(WARN, 'API キーチェック', `HTTP ${res.status}`);
    }
  } catch (e) {
    line(NG, 'API キー検証失敗', e.message);
  }
}

// 4. 期待される dept ワークフローのアクティブ化と webhook
if (N8N_API_KEY && dbOk) {
  try {
    const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const j = await res.json();
      const wfs = j.data ?? [];
      for (const dept of ['Sales', 'Marketing', 'Accounting', 'Analytics', 'General']) {
        const name = `org-ai Dept ${dept}`;
        const wf = wfs.find((w) => w.name === name);
        if (!wf) line(NG, `${name}`, '未登録 → npm run n8n:import');
        else if (!wf.active) line(WARN, `${name}`, 'inactive (UI で Activate 必須)');
        else line(OK, `${name}`, 'active');
      }
    }
  } catch (e) {
    line(WARN, 'ワークフロー一覧取得失敗', e.message);
  }
}

// 5. Webhook 疎通テスト (dept-general に dry run)
if (TOKEN) {
  try {
    const res = await fetch(`${N8N_URL}/webhook/dept-general`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-ai-token': TOKEN },
      body: JSON.stringify({ taskId: '__status_probe__', orgId: 'probe', title: '', input: '', department: 'GENERAL' }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404) {
      line(NG, 'webhook/dept-general 404', 'ワークフローを Activate してください');
    } else if (res.status === 403) {
      line(NG, 'webhook 認証失敗 403', 'Header Auth credential の token を確認');
    } else if (res.ok) {
      line(OK, 'webhook/dept-general 疎通 OK');
    } else {
      line(WARN, `webhook 応答 ${res.status}`);
    }
  } catch (e) {
    line(WARN, 'webhook 疎通テスト失敗', e.message);
  }
}

console.log('');
