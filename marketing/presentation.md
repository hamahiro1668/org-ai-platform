---
marp: true
theme: default
paginate: true
size: 16:9
backgroundColor: "#FFFCF7"
color: "#1F1B16"
style: |
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

  section {
    font-family: 'Noto Sans JP', system-ui, sans-serif;
    background: #FFFCF7;
    color: #1F1B16;
    padding: 64px 80px;
    font-size: 22px;
    line-height: 1.6;
    position: relative;
    overflow: hidden;
  }

  section::before {
    content: '';
    position: absolute;
    top: -200px;
    right: -200px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 181, 167, 0.35), rgba(157, 181, 255, 0.15) 60%, transparent 80%);
    filter: blur(60px);
    z-index: 0;
  }

  section::after {
    content: '';
    position: absolute;
    bottom: -180px;
    left: -180px;
    width: 520px;
    height: 520px;
    background: radial-gradient(circle, rgba(202, 255, 191, 0.35), rgba(189, 178, 255, 0.15) 60%, transparent 80%);
    filter: blur(60px);
    z-index: 0;
  }

  section > * {
    position: relative;
    z-index: 1;
  }

  h1, h2, h3 {
    font-family: 'Playfair Display', 'Noto Sans JP', serif;
    font-weight: 800;
    color: #1F1B16;
    letter-spacing: -0.01em;
  }

  h1 {
    font-size: 64px;
    line-height: 1.1;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #F59E6D 0%, #D7A7FF 30%, #9DB5FF 60%, #8FE5C6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  h2 {
    font-size: 40px;
    margin-bottom: 24px;
    border-bottom: 2px solid rgba(245, 158, 109, 0.3);
    padding-bottom: 12px;
  }

  h3 {
    font-size: 28px;
    margin-bottom: 12px;
  }

  strong {
    color: #C2410C;
    font-weight: 700;
  }

  code {
    background: rgba(255, 255, 255, 0.7);
    padding: 2px 8px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.85em;
    color: #6E6558;
  }

  table {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.92);
    box-shadow: 0 8px 24px rgba(45, 100, 95, 0.08);
    border-collapse: separate;
    border-spacing: 0;
    overflow: hidden;
    margin: 20px 0;
  }

  th, td {
    padding: 12px 20px;
    text-align: left;
    border-bottom: 1px solid rgba(110, 101, 88, 0.1);
  }

  th {
    background: rgba(255, 214, 165, 0.25);
    font-weight: 600;
    color: #1F1B16;
  }

  tr:last-child td {
    border-bottom: none;
  }

  ul, ol {
    padding-left: 28px;
  }

  li {
    margin: 8px 0;
    color: #1F1B16;
  }

  li::marker {
    color: #F59E6D;
  }

  blockquote {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px);
    border-left: 4px solid #F59E6D;
    border-radius: 12px;
    padding: 20px 28px;
    margin: 24px 0;
    box-shadow: 0 4px 16px rgba(45, 100, 95, 0.06);
    font-style: normal;
    color: #6E6558;
  }

  section.title {
    text-align: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  section.title h1 {
    font-size: 88px;
    margin-bottom: 24px;
  }

  section.title p {
    font-size: 28px;
    color: #6E6558;
  }

  section.lead {
    text-align: center;
  }

  .badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    background: linear-gradient(135deg, rgba(255, 181, 167, 0.4), rgba(189, 178, 255, 0.4));
    color: #1F1B16;
    margin-right: 8px;
  }

  footer {
    color: #A59B8C;
    font-size: 12px;
  }
---

<!-- _class: title -->
<!-- _paginate: false -->

# FLOW
## みんなのAIオフィス

<p>社長の一言で、部署AIが同時に動き出す。<br/>中小企業のための組織型AIエージェント基盤。</p>

<span class="badge">Organized AI SaaS</span>
<span class="badge">Liquid Glass Prism</span>

---

## 中小企業のAI導入、止まっていませんか？

中小企業は AI を使いたいのに、こんな壁にぶつかっています。

| 壁 | 現実 |
|---|---|
| **人材不足** | AI を使いこなせる専任担当者がいない |
| **情報の散逸** | 各自が ChatGPT を個別に使い、ノウハウも履歴もバラバラ |
| **ガバナンス不安** | 個人情報・社外秘の流出リスクが怖くて本格運用できない |
| **コスト** | 複数プロバイダの API 契約・管理が負担 |

> **FLOW は、この 4 つの壁を一度に壊します。**

---

## ソリューション: 社長は「指示するだけ」

```
      社長（あなた）
           │
           │ 「先週の見込み客に送る営業メール書いて」
           ▼
    ┌──────────────┐
    │  FLOW Chat UI │
    └──────┬───────┘
           │
           ▼  Intent 分類が自動で部署を判定
    ┌──────────────┐
    │   営業部 AI   │
    └──────┬───────┘
           │ 実行・起草・送信
           ▼
       メール草案
```

- **部署を指定しない** — 入力内容から自動判定
- **結果がチャットに戻る** — 履歴・成果物・タスクも一元管理

---

## ユーザー体験フロー

1. **チャットに指示を入力** — 「Twitterの投稿文3本作って、予算は月3万円」
2. **Intent 分類が部署判定** — マーケ部 AI へ自動ルーティング
3. **部署 AI が実行** — 専用 system prompt + Groq Llama3-70b
4. **PII スクリーナで安全確認** — 個人情報があれば警告・マスク
5. **監査ログに記録** — `AILog` に入出力・トークン・risk_score
6. **結果がチャットに表示** — 必要ならタスク化して進捗追跡

---

## 部署 AI ラインナップ

| 部署 | 担当 | 得意なこと |
|---|---|---|
| **営業部** | Sales Agent | 提案書・見積もり・営業メール・商談ノート |
| **マーケ部** | Marketing Agent | SNS 投稿・広告コピー・キャンペーン設計 |
| **経理部** | Accounting Agent | 請求書・経費レポート・予算・税務 |
| **分析部** | Analytics Agent | データ分析・KPI レポート・可視化 |
| **総合** | General Agent | 議事録・アジェンダ・何でも相談 |

各部署には専用の `system_prompt` と口調が設定されており、**同じ社内の別人格**のように振る舞います。

---

## アーキテクチャ

```
  ┌──────────┐   ┌──────────────┐   ┌──────────────┐
  │   web    │──▶│  api-gateway │──▶│   ai-engine  │
  │ React 18 │   │   Fastify    │   │   FastAPI    │
  │   :3000  │   │    :4000     │   │    :8000     │
  └──────────┘   └──────┬───────┘   └──────┬───────┘
                        │                   │
                        ▼                   ▼
                   ┌─────────┐         ┌─────────┐
                   │Postgres │         │  Groq   │
                   │ Prisma  │         │ Llama3  │
                   └─────────┘         │  70b    │
                        │              └─────────┘
                        ▼
                   ┌─────────┐
                   │   n8n   │ Workflows
                   └─────────┘
```

**3 層分離** により、フロント・ゲートウェイ・AI エンジンを独立にスケールできます。

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | React 18 / Vite / TypeScript (strict) / Tailwind / Framer Motion |
| 状態管理 | Zustand + React Query |
| API Gateway | Fastify / @fastify/jwt / @fastify/websocket / Zod |
| AI Engine | FastAPI / Python 3.11 / Pydantic |
| LLM | **Groq Llama3-70b** (default) + OpenAI + Anthropic |
| DB | Prisma ORM / SQLite (dev) / PostgreSQL (prod) |
| 認証 | JWT (HS256, 7d) + bcryptjs |
| 自動化 | n8n |
| Infra | Docker Compose / Turbo / npm workspaces |

---

## Intent 分類 → Agent 実行

```python
# orchestrator.py のコア
async def orchestrate(user_input: str, org_id: str):
    # 1. PII スクリーナで入力を検査
    pii_result = pii_screener.scan(user_input)
    if pii_result.critical:
        raise RiskEventCritical(...)

    # 2. Intent 分類
    department = intent_classifier.classify(user_input)

    # 3. 部署 Agent を選択
    agent = AGENT_REGISTRY[department]

    # 4. LLMRouter 経由で実行
    result = await agent.execute(user_input, context)

    # 5. 監査ログ記録
    audit_logger.record(org_id, department, input=user_input, output=result)

    return result
```

**ポイント**: Agent は LLM SDK を直接 import しません。必ず `LLMRouter` 経由。

---

## LLMRouter — マルチプロバイダ対応

```python
router = LLMRouter(
    providers=['groq', 'openai', 'anthropic'],
    default_model='llama3-70b-8192',
)
response = await router.complete(messages, temperature=0.7)
```

- **Primary**: Groq Llama3-70b（高速・低コスト）
- **Fallback 1**: OpenAI（品質保険）
- **Fallback 2**: Anthropic Claude（高難度タスク）
- **切替**: 環境変数の順序のみ、コード変更不要
- **レート制限時**: 自動で次のプロバイダにフェイルオーバ

> プロバイダ追加は 1 ファイルの追加だけ。ベンダーロックインなし。

---

## ガバナンス — 3 階層の防御

### 1️⃣ 入力検査（PIIScreener）
メール・電話番号・クレカ・マイナンバー等を検出 → LOW/MEDIUM/HIGH/CRITICAL で分類

### 2️⃣ 全入出力の監査ログ（AILog）
すべての LLM 呼び出しを `AILog` に記録。`inputText` `outputText` `tokens` `provider` `riskScore`

### 3️⃣ リスクイベントの可視化（RiskEvent）
HIGH/CRITICAL は `RiskEvent` として切り出し、GovernancePage で未解決一覧・ワンクリック解決

> **社長は全 AI 活動を 1 画面で見渡せる。**監査対応・コンプライアンス報告にそのまま使える。

---

## デザインシステム — Liquid Glass Prism

**哲学**: ウォーム白（`#FFFCF7`）のキャンバスに、パステル虹プリズム（coral → peach → gold → mint → sky → lavender）をアクセントとして配置する visionOS 的ライトモード。

### 部署色（`tone` prop 経由で指定）

| 部署 | 色名 | Hex |
|---|---|---|
| SALES | Warm Peach | `#F59E6D` |
| MARKETING | Lilac | `#D7A7FF` |
| ACCOUNTING | Honey | `#FFC971` |
| ANALYTICS | Sky Iris | `#9DB5FF` |
| GENERAL | Mint Jade | `#8FE5C6` |

**4 段階のガラス層**（thin / regular / thick / chrome）で奥行きを統一。

---

## タスク管理 & デリバラブル

### タスクボード
- チャットから生まれた作業を `Task` に変換
- ステータス: `PENDING` → `RUNNING` → `DONE` / `FAILED`
- 必要に応じて **n8n ワークフロー** をキック（SNS 投稿、メール送信、外部連携）

### デリバラブルボード
- @dnd-kit によるドラッグ&ドロップ
- AI が生成した成果物（コピー・レポート・画像）を整理
- 社長がワンクリックで採用 / 却下 / 再生成

---

## セキュリティ

- **JWT 認証** — HS256、7 日有効、`middleware/auth.ts` で全エンドポイント検証
- **bcryptjs** — ソルト 10 でパスワードハッシュ
- **マルチテナント分離** — 全テーブルに `orgId`、API は必ず `request.user.orgId` でフィルタ
- **ファイルアップロード** — `@fastify/multipart` で 20MB 上限、組織ごとに隔離保存
- **CORS** — `FRONTEND_URL` のみ許可
- **PII 先処理** — LLM 送信前に必ずスクリーナを通過

---

## 導入価値

| 価値 | 効果 |
|---|---|
| **効率化** | 社長 1 人で、営業・マーケ・経理の実務が同時進行 |
| **コスト削減** | Groq の低単価 + マルチプロバイダ最適化 |
| **セキュリティ** | PII 検知・監査ログ・JWT で企業基準対応 |
| **スピード** | メール / SNS / レポートが秒単位で生成 |
| **カスタマイズ** | 部署プロンプト・LLM・ワークフローを独自に拡張可能 |

> 「AI 担当者を雇う前に、AI に社員をやらせる」

---

## ユースケース

### 🧑‍💼 営業部
「先月契約更新しなかった顧客 10 社に、再アプローチメールを送って」
→ Sales Agent が CRM データを参照し、10 件分のパーソナライズメールを起草

### 📣 マーケ部
「新商品の発売告知、Twitter / Instagram / LinkedIn 用に作って」
→ Marketing Agent が各媒体のトーンに合わせて同時生成

### 💰 経理部
「先月の経費、部門ごとにまとめて前月比つきで」
→ Accounting Agent がレポート化、デリバラブルに保存

---

## ロードマップ

### Phase 1（現在）
- ✅ 5 部署 AI / Chat / タスク / デリバラブル / ガバナンス / ダッシュボード

### Phase 2（次期）
- 🚧 高度なマルチテナント管理（組織間招待・権限階層）
- 🚧 ガバナンスダッシュボードの AI 分析
- 🚧 n8n ワークフローテンプレート集

### Phase 3（将来）
- 🔮 部署 AI 同士の自律協調（Multi-Agent Orchestration）
- 🔮 社内ナレッジベース RAG 連携
- 🔮 音声入力 & モバイルネイティブ

---

## 料金プラン（予定）

| プラン | 対象 | 主な機能 |
|---|---|---|
| **STARTER** | 〜5 名 | 全部署 AI / 基本ガバナンス / 月間 10 万トークン |
| **PRO** | 〜30 名 | + マルチ LLM / タスク n8n 連携 / 月間 100 万トークン |
| **ENTERPRISE** | 30 名〜 | + SSO / 専用インスタンス / 監査エクスポート / 無制限 |

`Organization.plan` enum として DB に定義済み。アップグレードは 1 フィールド更新のみ。

---

## 今すぐ試せます

### 開発環境
```bash
git clone <repo>
cd org-ai-platform
cp .env.example .env        # GROQ_API_KEY, JWT_SECRET を設定
docker-compose up --build
```

### デモアカウント
- **Email**: `admin@demo.com`
- **Password**: `demo1234`

### 関連ドキュメント
- `README.md` — クイックスタート
- `docs/MASTERY_GUIDE.md` — 完全攻略ガイド
- `DESIGN.md` — デザインシステム
- `CLAUDE.md` — 開発契約書

---

<!-- _class: title -->
<!-- _paginate: false -->

# Thank You

## あなたの会社に、AI 部署を。

<p>FLOW — みんなのAIオフィス<br/>
<code>http://localhost:3000</code></p>

<span class="badge">Let's build the organized AI era.</span>
