# Task 00: プロジェクトセットアップ

## 目標
モノレポの基盤設定、共通型定義、docker-compose構成を作成する。

## 制約
- AWSなし、ローカル環境のみ
- LLM: Groq API (環境変数: GROQ_API_KEY)
- DB: SQLite (開発用)
- 認証: JWT自前実装

## 成果物

### 1. ルートpackage.json (ワークスペース設定)
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/package.json`

```json
{
  "name": "org-ai-platform",
  "private": true,
  "workspaces": ["apps/web", "apps/api-gateway", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=apps/api-gateway\" \"npm run dev --workspace=apps/web\"",
    "build": "turbo build"
  },
  "devDependencies": {
    "concurrently": "^8.0.0",
    "turbo": "^2.0.0"
  }
}
```

### 2. turbo.json
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

### 3. docker-compose.yml
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/docker-compose.yml`

サービス:
- `web`: React SPA (port 3000)
- `api-gateway`: Fastify (port 4000)
- `ai-engine`: FastAPI (port 8000)

環境変数はすべて `.env` から読み込む。

### 4. .env.example
```
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=sqlite:///./data/app.db
FRONTEND_URL=http://localhost:3000
API_GATEWAY_URL=http://localhost:4000
AI_ENGINE_URL=http://localhost:8000
```

### 5. shared-types パッケージ
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/packages/shared-types/`

以下の型を定義:
- `User`, `Organization`, `Plan`
- `AgentDepartment` (SALES, MARKETING, ACCOUNTING, GENERAL)
- `Task`, `TaskStatus`
- `Message`, `ChatSession`
- `APIResponse<T>`, `PaginatedResponse<T>`
- `ErrorCode` enum

### 6. db-schema パッケージ (Prisma)
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/packages/db-schema/`

SQLite用スキーマ:
- users, organizations, memberships
- chat_sessions, messages
- tasks, task_logs
- ai_logs (全LLM入出力記録)
- risk_events

## 完了条件
- [ ] package.json, turbo.json 作成済み
- [ ] docker-compose.yml 作成済み
- [ ] .env.example 作成済み
- [ ] shared-types の型定義完了
- [ ] Prismaスキーマ完了・マイグレーション実行可能な状態
