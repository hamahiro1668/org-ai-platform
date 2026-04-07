# Task 02: 認証システム

## 目標
JWT自前実装による認証をapi-gatewayに構築する。

## 成果物

### 1. 認証ルート
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/api-gateway/src/routes/auth.ts`

エンドポイント:
- `POST /api/auth/register` — ユーザー登録 (name, email, password, orgName)
- `POST /api/auth/login` — ログイン → JWT返却
- `POST /api/auth/logout` — ログアウト (トークン無効化)
- `GET  /api/auth/me` — 現在ユーザー情報取得

### 2. JWT ミドルウェア
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/api-gateway/src/middleware/auth.ts`

- Bearer tokenを検証
- `request.user` に `{ userId, orgId, role }` を注入
- 検証失敗時は `401 Unauthorized` を返す

### 3. パスワードハッシュ
- `bcryptjs` を使用
- ソルトラウンド: 10

### 4. JWT仕様
- アルゴリズム: HS256
- 有効期限: 7日
- ペイロード: `{ sub: userId, orgId, role, iat, exp }`
- シークレット: `process.env.JWT_SECRET`

### 5. api-gateway package.json
```json
依存パッケージ:
- fastify ^4
- @fastify/cors
- @fastify/jwt
- bcryptjs
- @prisma/client
- zod (バリデーション)

開発依存:
- typescript, tsx, @types/node, @types/bcryptjs
```

### 6. エラーレスポンス統一フォーマット
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

## 完了条件
- [ ] register/login エンドポイント動作確認
- [ ] JWT発行・検証動作確認
- [ ] 認証ミドルウェアが保護ルートに適用済み
