# Task 03: LLMルーター

## 目標
Groq APIをラップするLLMルーターをai-engineに実装する。
全LLM呼び出しはこのルーター経由のみ許可する。

## 成果物

### 1. LLMルーター
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/llm/router.py`

```python
class LLMRouter:
    async def chat(
        self,
        messages: list[dict],
        department: str,
        org_id: str,
        plan: str = "STARTER"
    ) -> LLMResponse:
        # プラン・部署に応じてモデル選択
        # 現在はGroq統一
        # 呼び出し前にPIIスクリーニング
        # 呼び出し後にai_logsへ記録
        ...
```

### 2. Groqプロバイダー
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/llm/providers/groq.py`

- モデル: `llama3-70b-8192` (デフォルト)
- フォールバック: `llama3-8b-8192`
- タイムアウト: 30秒
- リトライ: 最大3回 (指数バックオフ)

### 3. PIIスクリーナー
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/governance/pii_screener.py`

検知対象:
- メールアドレス (regex)
- 電話番号 (regex, 日本形式)
- クレジットカード番号 (regex + Luhnアルゴリズム)
- マイナンバー (regex)

PIIが検知された場合:
- `[PII_REDACTED]` でマスク
- RiskEventをDBに記録

### 4. Pydanticモデル
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/models/llm.py`

```python
class LLMRequest(BaseModel):
    messages: list[ChatMessage]
    department: str
    org_id: str
    plan: str = "STARTER"

class LLMResponse(BaseModel):
    content: str
    model: str
    tokens_used: int
    latency_ms: int
    pii_detected: bool
```

### 5. ai-engine FastAPIアプリ
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/main.py`

エンドポイント:
- `POST /llm/chat` — LLMルーター呼び出し
- `GET  /health` — ヘルスチェック

### 6. requirements.txt
```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
groq>=0.4.0
httpx>=0.26.0
pydantic>=2.0.0
python-dotenv
sqlalchemy>=2.0.0
aiosqlite
tenacity  # リトライ
```

## 完了条件
- [ ] `POST /llm/chat` でGroq呼び出し成功
- [ ] PII検知・マスキング動作確認
- [ ] ai_logsへの記録確認
- [ ] リトライ・フォールバック動作確認
