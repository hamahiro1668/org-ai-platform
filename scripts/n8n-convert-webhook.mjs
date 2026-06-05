#!/usr/bin/env node
// dept-*.json の Execute Workflow Trigger を Webhook トリガーに変換する。
// 変換後の JSON は同じファイルに上書き保存される（既に webhook 化済みなら何もしない）。

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const WF_DIR = join(HERE, '..', 'apps', 'n8n-workflows');

const TARGET_FILES = [
  'dept-sales.json',
  'dept-marketing.json',
  'dept-accounting.json',
  'dept-analytics.json',
  'dept-general.json',
];

function webhookPathFromFile(filename) {
  return basename(filename, '.json'); // "dept-sales.json" → "dept-sales"
}

function buildWebhookNode(path, position) {
  return {
    parameters: {
      httpMethod: 'POST',
      path,
      responseMode: 'onReceived',
      authentication: 'headerAuth',
      options: {},
    },
    id: 'trigger',
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: position ?? [240, 300],
    webhookId: randomUUID(),
  };
}

function rewriteExpressionString(s) {
  if (typeof s !== 'string') return s;
  return s
    .replaceAll("$('Execute Workflow Trigger').item.json.runData", "$('Webhook').item.json.body")
    .replaceAll('$json.runData', '$json.body')
    // jsCode 内の `$('Execute Workflow Trigger').item.json.runData` も同様にカバー済み
    ;
}

function walkAndRewrite(value) {
  if (Array.isArray(value)) return value.map(walkAndRewrite);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walkAndRewrite(v);
    return out;
  }
  return rewriteExpressionString(value);
}

async function convertOne(file) {
  const full = join(WF_DIR, file);
  const raw = await readFile(full, 'utf8');
  const wf = JSON.parse(raw);
  const triggerIdx = wf.nodes.findIndex(
    (n) => n.type === 'n8n-nodes-base.executeWorkflowTrigger',
  );
  if (triggerIdx < 0) {
    if (wf.nodes.some((n) => n.type === 'n8n-nodes-base.webhook' && n.name === 'Webhook')) {
      console.log(`[skip] ${file}: 既に Webhook トリガー化済み`);
      return;
    }
    console.log(`[skip] ${file}: トリガーが見つからない`);
    return;
  }

  const oldTrigger = wf.nodes[triggerIdx];
  const newTrigger = buildWebhookNode(webhookPathFromFile(file), oldTrigger.position);
  wf.nodes[triggerIdx] = newTrigger;

  // 接続キー "Execute Workflow Trigger" を "Webhook" にリネーム
  if (wf.connections && wf.connections['Execute Workflow Trigger']) {
    wf.connections['Webhook'] = wf.connections['Execute Workflow Trigger'];
    delete wf.connections['Execute Workflow Trigger'];
  }

  // 式中の参照を一括書き換え
  const rewritten = walkAndRewrite(wf);

  await writeFile(full, JSON.stringify(rewritten, null, 2) + '\n', 'utf8');
  console.log(`[ok]   ${file}: webhook path=/webhook/${webhookPathFromFile(file)}`);
}

const files = TARGET_FILES.length
  ? TARGET_FILES
  : (await readdir(WF_DIR)).filter((f) => f.startsWith('dept-') && f.endsWith('.json'));

for (const f of files) {
  await convertOne(f);
}

console.log('\n変換完了。各ワークフローに以下のヘッダで POST してください:');
console.log('  POST {N8N_URL}/webhook/dept-<dept>');
console.log('  Header: x-org-ai-token: $N8N_WEBHOOK_AUTH_TOKEN');
console.log('  Body  : { taskId, orgId, title, input, department, taskType, plan, callbackUrl, logUrl, aiEngineUrl }');
