# 依頼: org-ai-platform（FLOW）向け 3 点セット作成

以下 3 つの成果物を **並行して** 作成してください。すべて **日本語** で、独立ファイルとして出力します。

---

## プロダクト概要

**プロダクト名**: FLOW — みんなのAIオフィス
**種別**: 中小企業向け組織型 AI エージェント基盤 SaaS
**コンセプト**: 社長が自然言語で指示を出すと、Intent 分類が自動で部署を判定し、営業部 / マーケ部 / 経理部 / 分析部 / 総合の各 AI が分担・実行・報告する。全入出力を監査ログに記録し、PII 検知とリスクイベント管理でガバナンスを担保する。

### 想定規模

- 従業員 5〜100 名の中小企業
- 1 組織（`Organization`）= 1 テナント
- 日本語ファースト

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | React 18 / Vite / TypeScript (strict) / Tailwind / Framer Motion / Zustand / React Query / @dnd-kit / Recharts |
| API Gateway | Fastify + TypeScript / @fastify/jwt / @fastify/websocket / @fastify/multipart / Zod |
| AI Engine | FastAPI + Python 3.11 / Pydantic |
| LLM | Groq Llama3-70b（default）/ OpenAI / Anthropic（`LLMRouter` でフェイルオーバ） |
| DB | Prisma ORM / SQLite（開発）/ PostgreSQL（本番） |
| 認証 | JWT (HS256, 7 日) + bcryptjs |
| 自動化 | n8n |
| Infra | Docker Compose / Turbo / npm workspaces |

### サービス構成

| サービス | ポート | 役割 |
|---|---|---|
| `web` | 3000 | React SPA |
| `api-gateway` | 4000 | Fastify（認証・API・DB・WebSocket） |
| `ai-engine` | 8000 | FastAPI（Intent 分類・エージェント実行・LLM） |
| `postgres` | 5432 | 本番 DB（Docker Compose 時） |
| `n8n` | 5678 | ワークフロー自動化（Docker Compose 時） |

### モノレポ構成

```
org-ai-platform/
├── apps/
│   ├── web/                # React 18 + Vite
│   ├── api-gateway/        # Fastify
│   ├── ai-engine/          # FastAPI
│   └── n8n-workflows/
├── packages/
│   ├── shared-types/       # 共有 TypeScript 型
│   └── db-schema/          # Prisma schema & migrations
├── docker-compose.yml
├── README.md / CLAUDE.md / DESIGN.md
└── vercel.json
```

### データモデル（Prisma）

`User` / `Organization` / `ChatSession` / `Message` / `Task` / `TaskLog` / `AILog` / `RiskEvent` / `UploadedFile`

- すべての業務テーブルに `orgId`
- `Organization.plan` enum: `STARTER` / `PRO` / `ENTERPRISE`
- `RiskEvent.severity`: `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`
- `Message.role`: `user` / `assistant`、`Message.department` で担当部署を記録

### リクエストライフサイクル

```
ユーザー入力
  → [api-gateway] JWT 検証 (middleware/auth.ts)
  → POST /chat/sessions/:id/messages
  → [ai-engine] /orchestrate
    ├─ IntentClassifier が部署判定
    ├─ PIIScreener が入力検査 → RiskEvent 記録
    ├─ 部署 Agent を選択（BaseAgent 継承）
    ├─ LLMRouter 経由で Groq/OpenAI/Anthropic 呼び出し
    └─ AuditLogger が AILog に入出力・トークン・riskScore を記録
  → [api-gateway] Message を DB に保存
  → [web] ChatPage に表示
```

### 部署 AI

| 部署 | 色名 | Hex | 担当 |
|---|---|---|---|
| SALES | Warm Peach | `#F59E6D` | 提案書・見積・営業メール |
| MARKETING | Lilac | `#D7A7FF` | SNS 投稿・広告コピー・キャンペーン |
| ACCOUNTING | Honey | `#FFC971` | 請求書・経費・予算・税務 |
| ANALYTICS | Sky Iris | `#9DB5FF` | データ分析・レポート生成 |
| GENERAL | Mint Jade | `#8FE5C6` | 議事録・アジェンダ・何でも相談 |
| ASSISTANT | Rose | `#FFB5C5` | （拡張用） |

---

## デザインシステム — Liquid Glass Prism

**哲学**: ウォーム白（`#FFFCF7`）のキャンバスに、パステル虹プリズム（coral → peach → gold → mint → sky → lavender）をアクセントとして配置する visionOS 的ライトモード。

### 3 つの原則

1. **White Canvas** — 背景は純白に少しクリーム/ピーチを混ぜたウォームホワイト
2. **Natural Rainbow** — 彩度を抑えたパステル虹
3. **Clarity** — テキストは常に 4.5:1 以上のコントラスト

### カラートークン（抜粋）

| Token | Hex |
|---|---|
| `bg-canvas` | `#FFFCF7` |
| `bg-elevated` | `#FFFFFF` |
| `text-primary` | `#1F1B16` |
| `text-secondary` | `#6E6558` |
| `text-muted` | `#A59B8C` |
| `text-accent` | `#C2410C` |
| `rainbow-coral` | `#FFB5A7` |
| `rainbow-peach` | `#FFD6A5` |
| `rainbow-gold` | `#FDFFB6` |
| `rainbow-mint` | `#CAFFBF` |
| `rainbow-sky` | `#9BF6FF` |
| `rainbow-lavender` | `#BDB2FF` |
| `rainbow-rose` | `#FFC6FF` |

**虹グラデ**: `linear-gradient(135deg, #FFB5A7 0%, #FFD6A5 20%, #FDFFB6 38%, #CAFFBF 55%, #9BF6FF 72%, #BDB2FF 88%, #FFC6FF 100%)`

### タイポグラフィ

- **Sans**: Noto Sans JP（本文）
- **Display**: Playfair Display（ヒーロー見出し）
- **Mono**: JetBrains Mono（コード）

### ガラス 4 段階

| Variant | blur | tint | 用途 |
|---|---|---|---|
| thin | 8px | 55% | リスト・bubble |
| regular | 16px | 70% | 標準カード |
| thick | 24px | 82% | ヒーロー |
| chrome | 32px | 92% | TopBar・モーダル |

---

## 成果物 1: 完全攻略ガイド

### 形式
- **Markdown**（1 ファイル）
- ファイル名: `MASTERY_GUIDE.md`

### 対象読者
**開発者・運用者向け**（エンドユーザーの操作説明は最小限）

### セクション構成

1. プロダクト概要 — FLOW は何か / 何を解決するか / 対象規模
2. アーキテクチャ全体像 — 3 サービス構成図 + リクエストライフサイクル
3. モノレポ構成 — ディレクトリツリーと各責務
4. セットアップ完全版
   - ローカル 3 ターミナル起動手順
   - Docker Compose 一括起動
   - 環境変数: `GROQ_API_KEY` / `JWT_SECRET` / `DATABASE_URL` / `AI_ENGINE_URL` / `FRONTEND_URL`
   - デモアカウント: `admin@demo.com` / `demo1234`
5. データモデル — Prisma テーブル一覧と主要フィールド
6. API リファレンス — auth / chat / tasks / governance / files / webhooks
7. AI エンジン詳細 — BaseAgent / 部署別 Agent / Intent 分類 / LLMRouter / 新規部署追加手順
8. ガバナンス & セキュリティ — PIIScreener / AILog / RiskEvent / JWT / 開発ルール
9. デザインシステム概要 — Liquid Glass Prism 要点
10. デプロイ — Vercel（web）/ Render・Railway（api, ai-engine）/ SQLite → Postgres 切替
11. 運用 Runbook — よくある障害 / ログの見方 / リスク対応フロー
12. 拡張レシピ集 — 新規 Agent / API / LLM プロバイダ / n8n ワークフロー追加手順
13. 参考リンク

### 開発ルール（ガイドに必ず含める）

- TypeScript strict モード、Python は型ヒント必須
- すべての API に JWT 認証（認証系を除く）
- LLM 呼び出しは必ず `LLMRouter` 経由、SDK 直接 import 禁止
- すべての AI 入出力を `AILog` に記録
- PII 検知を通過してから LLM に送信
- エラーは `{ success: false, error: { code, message } }` で統一
- マルチテナント分離: すべての API は `request.user.orgId` でフィルタ

---

## 成果物 2: プレゼン資料

### 形式
- **Marp Markdown**（1 ファイル）
- ファイル名: `presentation.md`
- フロントマター: `marp: true` / `theme: default` / `paginate: true` / `size: 16:9` / `backgroundColor: "#FFFCF7"`
- HTML / PDF / PPTX にエクスポート可能

### スタイル要件
Marp の `<style>` セクションで以下を定義：
- ベース背景 `#FFFCF7`
- 見出しは Playfair Display、本文は Noto Sans JP（Google Fonts CDN）
- `h1` に虹グラデ（`background-clip: text`）
- 背景に `::before` `::after` で radial-gradient orb
- テーブル・blockquote をガラス風（`backdrop-filter: blur(16px)` + `rgba(255,255,255,0.7)`）
- アクセントテキストは `#C2410C`

### スライド構成（約 18 枚）

| # | スライド | 内容 |
|---|---|---|
| 1 | タイトル | FLOW — みんなのAIオフィス / タグライン |
| 2 | 課題 | 中小企業の AI 導入ハードル（人材/統制/コスト） |
| 3 | ソリューション | 社長が指示するだけで部署 AI が動く構造 |
| 4 | ユーザー体験フロー | チャット → 部署判定 → 実行 → 報告 |
| 5 | 部署 AI ラインナップ | 5 部署 + 部署色 |
| 6 | アーキテクチャ | 3 層 + Postgres + n8n |
| 7 | 技術スタック | React18・Fastify・FastAPI・Prisma・Groq |
| 8 | Intent 分類 → Agent 実行 | リクエストライフサイクル |
| 9 | LLMRouter | マルチプロバイダ フェイルオーバ |
| 10 | ガバナンス | PII / AILog / RiskEvent の 3 階層 |
| 11 | デザインシステム | Liquid Glass Prism / 部署色 |
| 12 | タスク管理 & デリバラブル | n8n 連携・DnD ボード |
| 13 | セキュリティ | JWT / bcryptjs / マルチテナント |
| 14 | 導入価値 | 効率化 / コスト / セキュリティ / スピード |
| 15 | ユースケース | 営業メール / SNS / 経費レポート |
| 16 | ロードマップ | マルチテナント強化 / Multi-Agent / RAG |
| 17 | 料金プラン | STARTER / PRO / ENTERPRISE |
| 18 | Thank you | デモアカウント情報 |

---

## 成果物 3: ランディングページ（LP）

### 形式
- **単一 HTML ファイル**
- ファイル名: `index.html`
- **Tailwind CDN** (`https://cdn.tailwindcss.com`) を使用 → ビルド不要
- Google Fonts から Noto Sans JP / Playfair Display / JetBrains Mono を読み込み
- バニラ JS 最小限（scroll fade-in）
- レスポンシブ対応（モバイル 1 カラム、デスクトップ 3 カラム）
- `prefers-reduced-motion` 対応

### Tailwind config で拡張する項目

- `colors`: canvas / elevated / primary / secondary / coral / peach / gold / mint / sky / lavender / sales / marketing / accounting / analytics / general
- `fontFamily`: sans (Noto Sans JP) / display (Playfair Display) / mono (JetBrains Mono)
- `boxShadow`: elev-1〜4 + glow
- `backdropBlur`: thin / regular / thick / chrome

### セクション構成

1. **固定ナビ** — ガラス chrome、ロゴ + メニュー + CTA
2. **Hero**
   - 見出し: 「あなたの会社に、AI 部署を。」（"AI 部署" を虹グラデで強調）
   - サブコピー: 「FLOW は、社長の一言で営業・マーケ・経理 AI が同時に動き出す組織型 AI プラットフォーム」
   - CTA: 「無料で始める」「デモを見る」
   - チャット UI のプレビューカード（ガラス thick）
   - 背景: 固定の pastel orb 4 つ（coral / sky / mint / lavender）+ multiply ブレンド + drift アニメ
3. **課題** — 中小企業の AI 導入を妨げる 3 つの壁
4. **ソリューション** — 3 ステップ（指示する → 部署 AI が実行する → 結果が届く）
5. **部署 AI ショーケース** — 6 部署 × GlassCard（部署色 `tone` 適用、トップボーダーで色を表現）
6. **機能ハイライト** — チャット / タスク管理 / デリバラブル / ガバナンス / ダッシュボード / マルチ LLM
7. **アーキテクチャ図** — Web → API → AI Engine + Postgres + n8n
8. **セキュリティ & ガバナンス** — 3 階層（PIIScreener / AILog / RiskEvent）
9. **料金プラン** — STARTER / PRO（人気バッジ付き）/ ENTERPRISE
10. **FAQ** — `<details>` アコーディオン 5 問
11. **Final CTA** — ガラス thick カード + `docker-compose up --build` コード表示
12. **フッター**

### デザイン要件

- **背景**: `#FFFCF7` + 固定 orb 4 つ（drift アニメ、multiply ブレンド、`filter: blur(80px)`）
- **カード**: `.glass` クラス = `rgba(255,255,255,0.70)` + `backdrop-blur(16px)` + 白境界
- **CTA ボタン**: 虹グラデ背景 + `rounded-full` + hover 時に `translateY(-2px)` と glow shadow
- **見出しフォント**: Playfair Display、本文 Noto Sans JP
- **スクロール**: `IntersectionObserver` で `.fade-in` クラスをトリガー
- **アクセシビリティ**: 4.5:1 以上のコントラスト

---

## 並列実行指示

3 ファイルは独立しているため、可能なら **同時並行** で生成してください。依存関係はありません。

1. `MASTERY_GUIDE.md`
2. `presentation.md`
3. `index.html`

---

## 使えるコピー候補

- **タグライン**: 「社長の一言で、部署 AI が同時に動き出す」
- **Hero 見出し**: 「あなたの会社に、AI 部署を。」
- **サブコピー**: 「FLOW は、社長の一言で営業・マーケ・経理 AI が同時に動き出す組織型 AI プラットフォーム」
- **ラストメッセージ**: 「AI 担当者を雇う前に、AI に社員をやらせる」
- **CTA**: 「無料で始める」「デモを見る」「今すぐ FLOW を試す」

---

以上、3 ファイルをまとめて出力してください。
