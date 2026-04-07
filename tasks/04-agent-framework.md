# Task 04: エージェントフレームワーク

## 前提条件
- Task 00, 01, 02, 03 完了済み

## 目標
部署別AIエージェントと、タスク分解・統合オーケストレーターを実装する。

## 成果物

### 1. ベースエージェント
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/agents/base.py`

```python
class BaseAgent:
    department: str
    system_prompt: str

    async def execute(self, task: AgentTask) -> AgentResult:
        # LLMRouterを経由して実行
        # 結果をTaskLogに記録
        ...
```

### 2. 部署エージェント (各ファイル)
`apps/ai-engine/app/agents/`

- `sales.py` — SalesAgent: 営業メール作成、見積もり生成、顧客対応
- `marketing.py` — MarketingAgent: SNS投稿、コピーライティング、キャンペーン企画
- `accounting.py` — AccountingAgent: 経費分析、請求書確認、レポート作成
- `general.py` — GeneralAgent: 汎用タスク、ルーティング不明時のデフォルト

各エージェントのシステムプロンプトは日本語で、役割を明確に定義する。

### 3. オーケストレーター
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/orchestrator/orchestrator.py`

```python
class Orchestrator:
    async def process(self, user_input: str, org_id: str) -> OrchestratorResult:
        # 1. IntentClassifierでどの部署かを分類
        # 2. 該当エージェントにタスクを振り分け
        # 3. 結果を統合して返却
        # 4. Taskレコードを作成・更新
        ...
```

### 4. インテント分類器
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/orchestrator/intent_classifier.py`

- LLMで入力テキストを分類
- 出力: `{ department: "SALES" | "MARKETING" | "ACCOUNTING" | "GENERAL", confidence: float }`

### 5. api-gatewayに追加するエンドポイント
`apps/api-gateway/src/routes/chat.ts`

- `POST /api/chat/sessions` — 新規セッション作成
- `GET  /api/chat/sessions` — セッション一覧
- `POST /api/chat/sessions/:id/messages` — メッセージ送信 → ai-engineに転送
- `GET  /api/chat/sessions/:id/messages` — メッセージ履歴取得

### 6. WebSocket (リアルタイム応答)
`apps/api-gateway/src/websocket/chat.ts`

- `ws://localhost:4000/ws` に接続
- ai-engineからのストリーミング応答を転送
- 認証: 接続時にJWTを検証

## 完了条件
- [ ] 各部署エージェントが独立して動作
- [ ] オーケストレーターがインテントを正しく分類し、適切なエージェントに振り分け
- [ ] チャットAPIが動作確認済み
- [ ] WebSocketでリアルタイム応答確認
