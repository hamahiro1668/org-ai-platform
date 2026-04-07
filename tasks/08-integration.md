# Task 08: 統合・最終確認

## 前提条件
- 全タスク (00〜07) 完了済み

## 目標
全コンポーネントを統合し、E2Eで動作する状態にする。

## 成果物

### 1. docker-compose.yml 最終版
全サービスが起動し、互いに通信できることを確認:
```yaml
services:
  ai-engine:
    build: ./apps/ai-engine
    ports: ["8000:8000"]
    env_file: .env

  api-gateway:
    build: ./apps/api-gateway
    ports: ["4000:4000"]
    depends_on: [ai-engine]
    env_file: .env

  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [api-gateway]
```

### 2. ヘルスチェック
各サービスにヘルスチェックを実装:
- `GET /health` → `{ status: "ok", version: "1.0.0", timestamp: "..." }`

### 3. E2Eシナリオ確認
以下のフローを手動またはスクリプトで確認:

1. **ユーザー登録・ログイン**
   - `POST /api/auth/register` → JWTトークン取得
   - `GET /api/auth/me` → ユーザー情報確認

2. **チャット (営業部署)**
   - `POST /api/chat/sessions` → セッション作成
   - `POST /api/chat/sessions/:id/messages` → "見込み客へのメールを作成して"
   - ai-engineがSalesAgentを呼び出し、Groq APIで応答生成
   - 応答がDBに保存され、レスポンスとして返却

3. **ガバナンス確認**
   - `GET /api/governance/logs` → AIログに記録されていること
   - `GET /api/governance/stats` → 統計に反映されていること

4. **ファイルアップロード**
   - `POST /api/files/upload` → ファイルアップロード成功
   - `GET /api/files/:id` → ダウンロード成功

### 4. README.md 作成
プロジェクトルートに作成:
- セットアップ手順 (npm install, .env設定, DBマイグレーション, docker-compose up)
- APIドキュメント概要
- 環境変数一覧

### 5. 起動スクリプト
`scripts/start-dev.sh`:
```bash
#!/bin/bash
cp .env.example .env  # 初回のみ
cd packages/db-schema && npx prisma migrate dev && npx prisma db seed
cd ../..
docker-compose up --build
```

## 完了条件
- [ ] `docker-compose up` で全サービス起動
- [ ] E2Eシナリオ全項目確認済み
- [ ] README.md 作成済み
