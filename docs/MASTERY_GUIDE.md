# FLOW — みんなのAIオフィス 完全攻略ガイド

> 開発者・運用者のためのマスター資料。`README.md` / `CLAUDE.md` / `DESIGN.md` / `tasks/*.md` の内容を統合し、セットアップから本番運用・拡張までを一本で通せるようにまとめたもの。

---

## 目次

1. [プロダクト概要](#1-プロダクト概要)
2. [アーキテクチャ全体像](#2-アーキテクチャ全体像)
3. [モノレポ構成](#3-モノレポ構成)
4. [セットアップ完全版](#4-セットアップ完全版)
5. [データモデル](#5-データモデル)
6. [API リファレンス](#6-api-リファレンス)
7. [AI エンジン詳細](#7-ai-エンジン詳細)
8. [ガバナンス & セキュリティ](#8-ガバナンス--セキュリティ)
9. [デザインシステム概要](#9-デザインシステム概要)
10. [デプロイ](#10-デプロイ)
11. [運用 Runbook](#11-運用-runbook)
12. [拡張レシピ集](#12-拡張レシピ集)
13. [参考リンク](#13-参考リンク)

---

## 1. プロダクト概要

**FLOW — みんなのAIオフィス** は、中小企業向けの「組織型 AI エージェント基盤 SaaS」。
社長（ユーザー）がチャット UI で自然言語の指示を出すと、内容に応じて営業部 / マーケ部 / 経理部 / 分析部 / 総合といった部署 AI へルーティングされ、分担・実行・報告まで自動化される。

### 解決する課題

| 課題 | FLOW のアプローチ |
|---|---|
| AI 担当人材が不在 | 社長が直接日本語で依頼すれば、Intent 分類が部署を判定し専門 AI が応える |
| ChatGPT を個別に使うと情報が散らばる | 全 AI 入出力を `AILog` に記録、チャット・タスクが組織単位で一元管理 |
| PII 流出 / コンプライアンス不安 | PII スクリーナ + RiskEvent による可視化、監査ログを標準装備 |
| 複数 LLM プロバイダを使い分けたい | `LLMRouter` 経由で Groq / OpenAI / Anthropic を切替 |

### 想定規模

- 従業員 5〜100 名の中小企業
- 日本語ファースト
- 1 組織（`Organization`）= 1 テナント、`User.role = OWNER` が社長

---

## 2. アーキテクチャ全体像

### 2.1 サービス構成

```
┌──────────┐       ┌──────────────┐        ┌──────────────┐
│   web    │─HTTP→ │  api-gateway │──HTTP──│   ai-engine  │
│ React 18 │  :3000│   Fastify    │  :4000 │   FastAPI    │ :8000
│   Vite   │       │  TypeScript  │        │   Python 3.11│
└──────────┘       └──────┬───────┘        └──────┬───────┘
                          │                        │
                          ▼                        ▼
                     ┌─────────┐              ┌─────────┐
                     │  DB     │              │  Groq   │
                     │ Prisma  │              │ Llama3  │
                     │ sqlite/ │              │  70b    │
                     │postgres │              └─────────┘
                     └─────────┘
                          │
                          ▼
                     ┌─────────┐
                     │  n8n    │  ワークフロー自動化
                     └─────────┘
```

| サービス | ポート | 役割 |
|---|---|---|
| `web` | 3000 | React SPA、社長 UI |
| `api-gateway` | 4000 | 認証・ルーティング・WebSocket・DB アクセス |
| `ai-engine` | 8000 | Intent 分類、エージェント実行、LLM 呼び出し、PII 検知 |
| `postgres`（Docker Compose 時） | 5432 | 本番想定 DB |
| `n8n`（Docker Compose 時） | 5678 | タスク連動の外部ワークフロー |

### 2.2 リクエストライフサイクル

```
ユーザー入力
    │
    ▼
[api-gateway] JWT 検証 (middleware/auth.ts)
    │
    ▼
[api-gateway] POST /chat/sessions/:id/messages
    │  ── Message を DB に保存
    ▼
[ai-engine] /orchestrate  (HTTP)
    │
    ├─ IntentClassifier が部署を判定 (orchestrator/intent_classifier.py)
    │
    ├─ PIIScreener が入力をスキャン (governance/pii_screener.py)
    │    └─ ヒットしたら RiskEvent + 応答拒否 or マスキング
    │
    ├─ BaseAgent を継承した部署 Agent を選択 (agents/sales.py など)
    │
    ├─ LLMRouter 経由で Groq/OpenAI/Anthropic を呼び出し (llm/router.py)
    │
    └─ AuditLogger が AILog に入出力・トークン・risk_score を記録
    │
    ▼
[api-gateway] 応答を Message として保存、web にレスポンス
    │
    ▼
[web] ChatPage に表示、必要なら TaskProgressSidebar 更新
```

---

## 3. モノレポ構成

```
org-ai-platform/
├── apps/
│   ├── web/                # React 18 + Vite + TypeScript (:3000)
│   ├── api-gateway/        # Fastify + TypeScript (:4000)
│   ├── ai-engine/          # FastAPI + Python 3.11 (:8000)
│   └── n8n-workflows/      # n8n ワークフロー定義
├── packages/
│   ├── shared-types/       # 共有 TypeScript 型
│   └── db-schema/          # Prisma schema & migrations
├── tasks/                  # エージェント開発タスク 00〜08
├── docker-compose.yml
├── README.md
├── CLAUDE.md               # 開発契約書
├── DESIGN.md               # Liquid Glass Prism デザインシステム
└── vercel.json
```

### 各ディレクトリの責務

| パス | 責務 |
|---|---|
| `apps/web/src/pages/` | Chat / Dashboard / Governance / TaskManager / Deliverables |
| `apps/web/src/components/ui/` | `GlassCard` `GlassButton` 等の Glass プリミティブ（[DESIGN.md](../DESIGN.md) §10） |
| `apps/web/src/templates/` | `AppShell` / `CenteredGlassLayout` / `SplitPanelLayout` 等 |
| `apps/web/src/store/` | Zustand ストア（auth / chat） |
| `apps/api-gateway/src/routes/` | `auth.ts` `chat.ts` `tasks.ts` `governance.ts` `files.ts` `agents.ts` `llm.ts` `webhooks.ts` |
| `apps/api-gateway/src/middleware/auth.ts` | JWT 検証、`request.user` 注入 |
| `apps/ai-engine/app/agents/` | `base.py` + 部署別エージェント |
| `apps/ai-engine/app/orchestrator/` | Intent 分類・エージェント選択・実行 |
| `apps/ai-engine/app/llm/router.py` | 複数 LLM プロバイダの切替とフェイルオーバ |
| `apps/ai-engine/app/governance/` | `pii_screener.py` / `audit_logger.py` |
| `packages/db-schema/prisma/` | `schema.prisma` / `seed.ts` / migrations |

---

## 4. セットアップ完全版

### 4.1 前提条件

- Node.js **20+**
- Python **3.11+**
- Groq API キー（[console.groq.com](https://console.groq.com)）

### 4.2 環境変数

プロジェクトルートに `.env` を作成。

```bash
# 必須
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=change-me-to-32-chars-or-more-random-secret

# 任意（デフォルトあり）
DATABASE_URL=file:./data/app.db
AI_ENGINE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 4.3 ローカル 3 ターミナル起動

```bash
# 依存インストール
cd org-ai-platform
(cd apps/api-gateway && npm install)
(cd apps/web && npm install)
(cd packages/shared-types && npm install)
(cd packages/db-schema && npm install)

# Python 仮想環境
cd apps/ai-engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..

# DB マイグレーション & シード
mkdir -p data
cd packages/db-schema
DATABASE_URL="file:../../data/app.db" npx prisma migrate dev --name init
DATABASE_URL="file:../../data/app.db" npx ts-node prisma/seed.ts
cd ../..
```

起動は 3 ターミナルに分けて：

```bash
# T1: ai-engine
cd apps/ai-engine
source .venv/bin/activate
GROQ_API_KEY=$GROQ_API_KEY uvicorn app.main:app --reload --port 8000
```

```bash
# T2: api-gateway
cd apps/api-gateway
DATABASE_URL="file:../../data/app.db" \
JWT_SECRET=$JWT_SECRET \
AI_ENGINE_URL=http://localhost:8000 \
npm run dev
```

```bash
# T3: web
cd apps/web
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### 4.4 デモアカウント

- Email: `admin@demo.com`
- Password: `demo1234`

### 4.5 Docker Compose 一括起動

`docker-compose.yml` には Postgres・n8n・ai-engine・api-gateway・web の 5 サービスが定義されている。

```bash
cp .env.example .env     # GROQ_API_KEY, JWT_SECRET を設定
docker-compose up --build
```

- `postgres:5432` が起動し、`DATABASE_URL=postgresql://orgai:orgai-dev-password@postgres:5432/orgai` で api-gateway と ai-engine が接続
- `n8n:5678` はローカル自動化ワークフロー
- ヘルスチェックで依存順に起動（postgres → ai-engine → api-gateway → web）

---

## 5. データモデル

`packages/db-schema/prisma/schema.prisma` に定義。開発は SQLite、本番は PostgreSQL を同じスキーマで使える。

| テーブル | 主な用途 | 主要フィールド |
|---|---|---|
| `Organization` | テナント | `id` `name` `plan (STARTER/PRO/ENTERPRISE)` |
| `User` | ユーザー | `id` `email` `passwordHash` `role (OWNER)` `orgId` |
| `ChatSession` | チャットセッション | `id` `orgId` `title` |
| `Message` | メッセージ | `id` `sessionId` `role (user/assistant)` `content` `department` |
| `Task` | タスク | `id` `orgId` `title` `status` `department` `n8nWorkflowId` |
| `TaskLog` | タスク実行ログ | `id` `taskId` `message` `level` |
| `AILog` | AI 入出力監査 | `id` `orgId` `department` `provider` `model` `inputText` `outputText` `tokens` `riskScore` |
| `RiskEvent` | リスク検知イベント | `id` `orgId` `aiLogId` `severity (LOW/MEDIUM/HIGH/CRITICAL)` `resolved` |
| `UploadedFile` | アップロードファイル | `id` `orgId` `filename` `path` `mimeType` |

**マルチテナントの鍵**: すべての業務テーブルに `orgId` が付与されており、API は必ず `request.user.orgId` でフィルタする。

---

## 6. API リファレンス

すべてのレスポンスは以下の統一フォーマット。

```ts
// 成功
{ success: true, data: {...} }

// 失敗
{ success: false, error: { code: 'UNAUTHORIZED', message: '...' } }
```

認証系を除く全エンドポイントは `Authorization: Bearer <JWT>` を要求する。

### 6.1 認証（`apps/api-gateway/src/routes/auth.ts`）

| Method | Path | 説明 |
|---|---|---|
| POST | `/auth/register` | ユーザー登録。bcryptjs でハッシュ化、`Organization` 作成、JWT 発行 |
| POST | `/auth/login` | Email/Password でログイン、JWT (HS256, 7d) 発行 |
| GET | `/auth/me` | 現在のユーザー情報返却 |

### 6.2 チャット（`routes/chat.ts`）

| Method | Path | 説明 |
|---|---|---|
| POST | `/chat/sessions` | セッション作成 |
| GET | `/chat/sessions` | 組織のセッション一覧 |
| GET | `/chat/sessions/:id` | セッション詳細 + メッセージ |
| POST | `/chat/sessions/:id/messages` | ユーザーメッセージ送信 → ai-engine にフォワード → アシスタント応答を保存 |

### 6.3 タスク（`routes/tasks.ts`）

| Method | Path | 説明 |
|---|---|---|
| POST | `/tasks` | タスク作成（必要なら n8n ワークフロー起動） |
| GET | `/tasks` | 組織のタスク一覧 |
| PATCH | `/tasks/:id/status` | ステータス遷移（`PENDING` → `RUNNING` → `DONE` / `FAILED`） |

### 6.4 ガバナンス（`routes/governance.ts`）

| Method | Path | 説明 |
|---|---|---|
| GET | `/governance/logs` | `AILog` 一覧。フィルタ: department / date / provider |
| GET | `/governance/risks` | `RiskEvent` 一覧。未解決のみデフォルト |
| PATCH | `/governance/risks/:id/resolve` | リスクを解決済みにマーク |

### 6.5 ファイル（`routes/files.ts`）

| Method | Path | 説明 |
|---|---|---|
| POST | `/files/upload` | multipart アップロード（`@fastify/multipart`、最大 20MB） |
| GET | `/files/:id` | ファイルダウンロード |

### 6.6 Webhook / n8n 連携（`routes/webhooks.ts`）

n8n からコールバックを受けてタスクのステータスを更新する。

---

## 7. AI エンジン詳細

### 7.1 BaseAgent

すべての部署 AI は `apps/ai-engine/app/agents/base.py` の `BaseAgent` を継承する。

```python
class BaseAgent:
    name: str
    department: str
    system_prompt: str

    async def execute(self, user_message: str, context: dict) -> AgentResult:
        # LLMRouter 経由で LLM を呼び出す
        ...
```

### 7.2 部署別エージェント

| 部署 | ファイル | 主な用途 |
|---|---|---|
| 営業 | `agents/sales.py` | 提案書・見積・営業メール |
| マーケ | `agents/marketing.py` | SNS 投稿・広告コピー・キャンペーン |
| 経理 | `agents/accounting.py` | 請求書・経費・予算・税務 |
| 分析 | `agents/analytics.py` | データ分析・レポート生成 |
| 総合 | `agents/general.py` | 何でも相談 |

### 7.3 Intent 分類

`orchestrator/intent_classifier.py` がユーザー入力を受け取り、キーワード/軽量 LLM 判定で `department` を返す。分類結果は `Message.department` に保存される。

### 7.4 LLMRouter

`llm/router.py` は環境変数で指定されたプロバイダを順に試し、失敗したら次へフェイルオーバする。

```python
router = LLMRouter(
    providers=['groq', 'openai', 'anthropic'],
    default_model='llama3-70b-8192',
)
response = await router.complete(messages, temperature=0.7)
```

**開発ルール（CLAUDE.md より）**: エージェントは LLM SDK を直接 import してはいけない。必ず `LLMRouter` 経由で呼び出す。

### 7.5 新しい部署 AI を追加する手順

1. `apps/ai-engine/app/agents/legal.py` を新規作成、`BaseAgent` を継承
2. `system_prompt` を定義（部署の責務と口調）
3. `orchestrator/orchestrator.py` の AGENT_REGISTRY に `'LEGAL': LegalAgent()` を追加
4. `intent_classifier.py` のキーワード表に法務系の単語を追加
5. `apps/web/src/constants/departments.ts` に色と表示名を追加
6. `packages/db-schema/prisma/schema.prisma` の `Department` enum に `LEGAL` を追加し migrate

---

## 8. ガバナンス & セキュリティ

### 8.1 PII スクリーナ

`apps/ai-engine/app/governance/pii_screener.py` は、LLM 送信前にユーザー入力を検査する。

- 検出対象: メール / 電話番号 / クレジットカード番号 / マイナンバー 等
- ヒット時: `riskScore` を算出し、`AILog` と `RiskEvent` に記録
- 重大度別の挙動（LOW: 通す / MEDIUM: マスキング / HIGH: 警告 / CRITICAL: 拒否）

### 8.2 監査ログ

`governance/audit_logger.py` がすべての LLM 入出力を `AILog` に保存する。

- `inputText` `outputText` `tokens` `provider` `model` `department` `riskScore`
- `GET /governance/logs` でフロントの GovernancePage から閲覧可能

### 8.3 JWT ミドルウェア

`apps/api-gateway/src/middleware/auth.ts` が Bearer トークンを検証し、`request.user` に `{ id, orgId, role }` を注入する。認証系（`/auth/*`）以外のすべてのルートで有効。

### 8.4 開発ルール（CLAUDE.md 由来）

- TypeScript strict モード、Python は型ヒント必須
- すべての API に JWT 認証（認証系を除く）
- LLM 呼び出しは必ず `LLMRouter` 経由
- すべての AI 入出力を `AILog` に記録
- PII 検知を通過してから LLM に送信
- エラーは `{ success: false, error: { code, message } }` で統一
- 環境変数は `.env` で管理

---

## 9. デザインシステム概要

詳細は [DESIGN.md](../DESIGN.md)。ここでは要点のみ。

### 9.1 哲学 — Liquid Glass Prism

ウォーム白（`#FFFCF7`）のキャンバスに、パステル虹プリズム（coral / peach / gold / mint / sky / lavender）をアクセントとして配置するライトモード。visionOS 的な半透明ガラス層が特徴。

### 9.2 カラートークン（抜粋）

| カテゴリ | Token | Hex |
|---|---|---|
| 背景 | `bg-canvas` | `#FFFCF7` |
| 背景 | `bg-elevated` | `#FFFFFF` |
| テキスト | `text-primary` | `#1F1B16` |
| テキスト | `text-secondary` | `#6E6558` |
| 虹 | `rainbow-coral` | `#FFB5A7` |
| 虹 | `rainbow-mint` | `#CAFFBF` |
| 虹 | `rainbow-sky` | `#9BF6FF` |
| 部署: SALES | Warm Peach | `#F59E6D` |
| 部署: MARKETING | Lilac | `#D7A7FF` |
| 部署: ACCOUNTING | Honey | `#FFC971` |
| 部署: ANALYTICS | Sky Iris | `#9DB5FF` |
| 部署: GENERAL | Mint Jade | `#8FE5C6` |

### 9.3 コアコンポーネント

`apps/web/src/components/ui/` に配置。HTML タグに Tailwind を直接書かず、必ずこれらを経由する。

- `<GlassCard variant tone interactive>` — 標準カード
- `<GlassButton variant tone icon>` — ボタン（primary/secondary/ghost/glass/danger）
- `<GlassInput multiline>` — 入力
- `<GlassBadge tone>` — 部署バッジ
- `<GlassPanel side open>` — パネル・ドロワー
- `<GlassNav>` + `<GlassNavItem>` — `layoutId` でスムーズに遷移
- `<AmbientBackground>` — ページ背景の虹オーブ

### 9.4 Do / Don't

- ✅ `tone` prop で部署色を指定する（直接 Hex を書かない）
- ✅ 影は `shadow-elev-*`、アニメーションは `duration-*` トークン
- ❌ `bg-white` / `text-gray-500` / カスタム `box-shadow` は使わない

---

## 10. デプロイ

### 10.1 web（Vercel）

`vercel.json` を使用。`apps/web` をフレームワーク検出で Vite ビルド。環境変数 `VITE_API_URL` に api-gateway の公開 URL を設定。

### 10.2 api-gateway / ai-engine（Render / Railway）

Dockerfile がそれぞれ用意されている。必要環境変数：

| サービス | 必須環境変数 |
|---|---|
| api-gateway | `DATABASE_URL` `JWT_SECRET` `AI_ENGINE_URL` `FRONTEND_URL` |
| ai-engine | `GROQ_API_KEY` `DATABASE_URL` |

### 10.3 SQLite → PostgreSQL 切替

1. Postgres インスタンスを準備
2. `DATABASE_URL=postgresql://user:pass@host:5432/db` を設定
3. `packages/db-schema/prisma/schema.prisma` の `datasource db` を `postgresql` に変更
4. `npx prisma migrate deploy`

---

## 11. 運用 Runbook

### 11.1 よくある障害

| 症状 | 原因 | 対処 |
|---|---|---|
| ai-engine が起動しない | `GROQ_API_KEY` 未設定 | `.env` を確認、`uvicorn` の環境変数を確認 |
| `401 Unauthorized` 連発 | JWT トークン期限切れ（7 日） | 再ログイン |
| Groq API レート制限 | 同時リクエスト過多 | `LLMRouter` に OpenAI / Anthropic をフォールバックとして追加 |
| `prisma migrate dev` 失敗 | DB ファイルパス不一致 | `DATABASE_URL="file:../../data/app.db"` で実行しているか確認 |
| web のビルドで Glass コンポーネント型エラー | `tone` に存在しない部署名 | `constants/departments.ts` を確認 |

### 11.2 ログの見方

- **api-gateway**: Fastify logger が JSON 形式で stdout に出力
- **ai-engine**: uvicorn の標準ログ + `AILog` テーブル
- **監査**: GovernancePage（`/governance`）から `AILog` と `RiskEvent` を UI で閲覧

### 11.3 リスクイベント対応フロー

1. GovernancePage で RiskEvent 一覧を開く
2. `severity = HIGH / CRITICAL` を優先チェック
3. 該当する `AILog` を開き、入力内容と応答を確認
4. 対応後 `PATCH /governance/risks/:id/resolve` で解決済みに

---

## 12. 拡張レシピ集

### 12.1 新規エージェント追加

[§7.5](#75-新しい部署-ai-を追加する手順) を参照。

### 12.2 新規 API エンドポイント追加

1. `apps/api-gateway/src/routes/` に新ファイル（例: `reports.ts`）
2. `fastify.register()` で登録、JWT preHandler を設定
3. `packages/shared-types` に型を追加し、web から import
4. Zod でバリデーション

### 12.3 新規 LLM プロバイダ追加

1. `apps/ai-engine/app/llm/providers/` に `mistral.py` などを追加
2. `LLMRouter` の providers マップに登録
3. 環境変数 `MISTRAL_API_KEY` を追加
4. フェイルオーバ順序を `.env` で調整

### 12.4 n8n ワークフロー連携

1. n8n UI（http://localhost:5678）でワークフロー作成
2. ワークフロー ID を `Task.n8nWorkflowId` に保存
3. `routes/tasks.ts` がタスク作成時に n8n REST API をキック
4. 完了時に n8n から `POST /webhooks/n8n` を呼ばせてステータス更新

---

## 13. 参考リンク

- [README.md](../README.md) — クイックセットアップ
- [CLAUDE.md](../CLAUDE.md) — 開発契約書・コーディング規約
- [DESIGN.md](../DESIGN.md) — Liquid Glass Prism デザインシステム詳細
- [tasks/](../tasks/) — エージェント開発用タスク定義（Phase 1〜5）
- [docker-compose.yml](../docker-compose.yml) — 全サービス一括起動
- [packages/db-schema/prisma/schema.prisma](../packages/db-schema/prisma/schema.prisma) — データモデル定義

---

**このドキュメントは生きた契約書です。** アーキテクチャや運用手順が変わったら、コードと同時にここも更新してください。
