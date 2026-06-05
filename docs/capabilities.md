# Capability Registry — 運用ガイド

> このドキュメントは **Phase 0 (MVP)** 時点の運用手順。Phase 1 以降で dept-* 経路を
> 段階的に capability 経路に移行する。

---

## 1. 全体像

```
client (UI/curl)
  └─ POST /api/capabilities/resolve { rawInput | name + args }
        ├─ Gateway: capability-resolver.ts
        │   ├─ name 未指定なら AI Engine /plan で {name, args} を取得
        │   ├─ Capability テーブル参照 + Ajv で args 検証
        │   ├─ RequiredCredential を n8n /api/v1/credentials で照会 (3 分キャッシュ)
        │   └─ 分岐: EXECUTED / NEEDS_AUTH / VALIDATION_ERROR / UNSUPPORTED
        ├─ ACTIVE+CONNECTED → POST n8n /webhook/<webhookPath>
        ├─ NEEDS_AUTH → missing[] を返却 (フロントで「接続を促す」)
        └─ UNSUPPORTED → CapabilityGap upsert + notify_slack を内部呼び出し
```

主要ファイル:
- [packages/db-schema/prisma/schema.prisma](../packages/db-schema/prisma/schema.prisma) — Capability/RequiredCredential/CapabilityGap/ExecutionLog
- [apps/api-gateway/src/services/capability-resolver.ts](../apps/api-gateway/src/services/capability-resolver.ts) — 解決ロジック本体
- [apps/api-gateway/src/routes/capabilities.ts](../apps/api-gateway/src/routes/capabilities.ts) — REST 入口
- [apps/ai-engine/app/planner/](../apps/ai-engine/app/planner/) — 自然言語 → `{capability_name, args}` プランナー
- [apps/n8n-workflows/cap-*.json](../apps/n8n-workflows/) — capability 実行ワークフロー

---

## 2. 標準レスポンス・エンベロープ (n8n → Gateway)

すべての `cap-*` ワークフローは最後に **必ず** 以下の JSON を返す:

```json
{ "status": "success" | "error",
  "error_type": "AUTH_MISSING|RATE_LIMIT|NODE_FAILED|TIMEOUT|VALIDATION_ERROR|null",
  "message": "人間可読の説明",
  "data": { /* capability 固有の戻り値 */ } }
```

Gateway はこれを `ExecutionLog` テーブルにそのまま記録する。

---

## 3. 初回セットアップ手順

### 3.1 DB マイグレーション
```bash
export DATABASE_URL=postgresql://...
npx prisma migrate deploy --schema=packages/db-schema/prisma/schema.prisma
```

### 3.2 シードデータ投入 (5 件の capability)
```bash
ORG_ID=<your org cuid> npx tsx packages/db-schema/prisma/seed-capabilities.ts
```
- `ORG_ID` 未指定なら最古の Organization に対して投入。
- 投入後の状態: `draft_email` のみ ACTIVE。他は NEEDS_AUTH (credential 接続待ち)。

### 3.3 n8n ワークフローのインポート
```bash
npm run n8n:import
```
- `dept-*.json` と `cap-*.json` の両方を一括 import + activate する。
- 失敗時は `npm run n8n:status` で診断。

### 3.4 Header Auth credential を Webhook に紐付け
n8n UI でのワンタイム作業 ([docs/n8n-setup.md §4](./n8n-setup.md#4-webhook-認証-ui-で-1-回だけ必要) 参照)。

---

## 4. 新しい capability を追加する手順

1. **n8n でワークフロー作成** (`cap-<name>` の path / Header Auth / §2 エンベロープを満たす Code ノード)
2. **JSON エクスポート** → `apps/n8n-workflows/cap-<name>.json`
3. **シードに追記** または DB に直接 INSERT:
   ```ts
   await prisma.capability.create({
     data: {
       orgId, name, displayName, description, department,
       inputSchema: { type: 'object', required: [...], properties: {...} },
       status: 'NEEDS_AUTH',  // creds 必要なら
       webhookPath: 'cap-<name>',
     },
   });
   ```
4. **RequiredCredential を追加** (必要な provider 分)
5. `npm run n8n:import` で n8n に反映 → UI で Header Auth credential 紐付け → Activate
6. n8n UI 上で provider (Gmail / X / Slack 等) の credential を接続
7. 動作確認:
   ```bash
   curl -X POST http://localhost:4000/api/capabilities/resolve \
     -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"name":"<name>","args":{...}}'
   ```

---

## 5. 端末からの動作確認 (受け入れ基準)

JWT を `$JWT` に入れた状態で:

```bash
# ケース 1: 即実行
curl -s -X POST http://localhost:4000/api/capabilities/resolve \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"rawInput":"営業メールの下書きを作って。佐藤部長宛、進捗報告。"}' | jq

# 期待: { outcome: "EXECUTED", capability: "draft_email", envelope: { status:"success", data: { subject, body } } }

# ケース 2: 要接続
curl -s -X POST http://localhost:4000/api/capabilities/resolve \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"rawInput":"このメールを送って 宛先 a@b.com 件名 X 本文 Y"}' | jq

# 期待: { outcome: "NEEDS_AUTH", capability: "send_email", missing: ["gmail"] }

# ケース 3: 未対応
curl -s -X POST http://localhost:4000/api/capabilities/resolve \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"rawInput":"TikTokに投稿して"}' | jq

# 期待: { outcome: "UNSUPPORTED", inferredName: ~, gapId: ~ }
# → GET /api/capabilities/gaps で確認可能

# ケース 4: 引数バリデーション失敗
curl -s -X POST http://localhost:4000/api/capabilities/resolve \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"name":"draft_email","args":{"purpose":"進捗"}}' | jq

# 期待: { outcome: "VALIDATION_ERROR", errors: [...recipientHint 関連] }

# ケース 5: n8n 停止時
docker stop n8n  # もしくは Render service を停止
curl -s -X POST http://localhost:4000/api/capabilities/resolve \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"name":"draft_email","args":{"recipientHint":"x","purpose":"y"}}' | jq

# 期待: { outcome: "EXECUTED", envelope: { status:"error", error_type:"TIMEOUT" | "NODE_FAILED" } }
```

---

## 6. 監視ポイント

| 何を見るか | エンドポイント / クエリ |
|---|---|
| 実行履歴 | `GET /api/capabilities/execution-logs?limit=100` |
| 未対応要望ランキング | `GET /api/capabilities/gaps` (count 降順) |
| ケイパビリティ一覧と状態 | `GET /api/capabilities` |
| LLM 単体ログ (Planner 含む) | `GET /api/governance/ai-logs` (既存) |

---

## 7. 既知の制限 / 注意 (MVP 時点)

- **クレデンシャル状態の検出**: n8n の credential `name` または `type` に provider 名 (gmail / x / slack 等) が含まれるかで判定。命名が曖昧だと誤判定する可能性 → credential 名を `provider-...` プレフィックスで揃えること。
- **dept ルーティングと並走**: 既存 `dispatchQueuedTask` (apps/api-gateway/src/services/task-executor.ts) は残してあるため、Task 作成経路は capability に変わらない。capability 経路を使うのは `/api/capabilities/resolve` を叩いた時のみ。
- **テナント前提**: capability は `orgId` 必須で投入される。新規 Organization 作成時に capability シードを自動投入する仕組みは未実装。当面は手動シード。
- **notify_slack 自己呼び出し**: 無限再帰防止のためモジュール内変数 `resolvingNotifySlack` で 1 段に制限。並行リクエストでは順序依存があるので、本番では Slack Webhook URL の直接呼び出しに置き換える可能性あり。

---

## 8. Phase 1 以降への展望

- dept-* ワークフローを capability 単位に分解 (`dept-sales` → `cap-draft_email` / `cap-send_email` / ...)
- ChatPage / TaskManagerPage の起点を `/api/capabilities/resolve` に切り替え
- 管理 UI: `/capabilities` ページで capability 一覧 / Gap ランキング / Execution Log を可視化
- credential 接続 UX: n8n への deep link + 接続後 callback (Webhook) で `lastCheckedAt` 即時更新
