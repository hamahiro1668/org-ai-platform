# 作業ログ — org-ai-platform 最適化 + n8nエージェント機能

ブランチ: `feat/agent-create-n8n`（`feat/n8n-per-department` から分岐）
計画: `~/.claude/plans/org-ai-platform-n-n-n-n-happy-harp.md`

方針（ユーザー確認済み）:
- エージェント方式 = ハイブリッド（DB が真実の源 + n8n 専用ワークフロー best-effort 生成 + AI Engine フォールバック）
- n8n 稼働 = 無料 + 優雅な縮退（リトライ / 「n8n起動中…」可視化 / 平日日中 keepalive）
- デプロイ = Vercel プレビューのみ（本番 `flow` は上書きしない）

---

## 2026-06-10

### Phase 0: 調査（Explore × 3 + Plan agent）
- UI: 孤児 `DashboardPage.tsx`、死んだ Bell ボタン、重複 `GlassCard`、未使用 `GlassNav`/`GlassPanel`、`/governance` がメインナビ未掲載、エージェントはハードコード静的リスト。
- バックエンド: `Capability` 系は実装済みだが `Agent` モデル・作成/再選択/再実行・動的 n8n ワークフロー生成が無い。
- インフラ: Render 無料枠 n8n は ~15分でスリープ、無料枠 750h/月制約で3サービス常時稼働不可、keepalive 無し。`CLAUDE.md`/`.env` の Groq 記述は陳腐化（実体は Anthropic）。

### Phase 1: Prisma `Agent` モデル + マイグレーション ✅
- `packages/db-schema/prisma/schema.prisma`: `enum AgentN8nStatus`/`AgentTrigger`、`model Agent`、`Organization.agents`、`Task.agentId`(+optional relation, `Task_orgId_agentId_idx`) を追加。
- マイグレーション `migrations/20260610000000_add_agent/migration.sql` を手書き（docker 不在のため。既存マイグレーションの SQL 規約に準拠。`Task.agentId` は `ON DELETE SET NULL` で削除時に履歴保持）。
- `prisma format`/`validate`（DATABASE_URL 由来の env エラーのみ＝スキーマ自体は正常）/`generate` 成功。`Agent`/`AgentN8nStatus` 型生成を確認。
