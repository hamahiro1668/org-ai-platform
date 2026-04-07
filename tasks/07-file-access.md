# Task 07: ファイルアクセス制御

## 前提条件
- Task 02 (認証) 完了済み

## 目標
ローカルファイルシステムへの安全なファイルアップロード・ダウンロード機能を実装する。
(AWSなし: S3の代わりにローカルストレージを使用)

## 成果物

### 1. ファイルアップロードAPI
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/api-gateway/src/routes/files.ts`

エンドポイント:
- `POST /api/files/upload` — ファイルアップロード (multipart/form-data)
- `GET  /api/files/:fileId` — ファイルダウンロード (署名付きURL相当の一時トークン)
- `GET  /api/files` — ファイル一覧 (org単位)
- `DELETE /api/files/:fileId` — ファイル削除

### 2. セキュリティ
- ファイルサイズ上限: 10MB
- 許可MIMEタイプ: PDF, DOCX, XLSX, CSV, TXT, PNG, JPG
- ファイルはorgIdディレクトリに保存: `./data/files/{orgId}/{fileId}_{originalName}`
- ダウンロードは認証ユーザーの所属orgのファイルのみ
- パストラバーサル攻撃対策 (path.resolve で検証)

### 3. ファイルメタデータ (DBモデル追加)
Prismaスキーマに追加:
```prisma
model UploadedFile {
  id           String   @id @default(cuid())
  orgId        String
  uploadedBy   String
  originalName String
  storagePath  String
  mimeType     String
  sizeBytes    Int
  createdAt    DateTime @default(now())
}
```

### 4. AIエージェントとの連携
- ファイル内容をテキスト抽出してAIエージェントへ渡す
- `POST /api/files/:fileId/analyze` — ファイルをAIで分析 (部署指定可)

### 5. @fastify/multipart 設定
```typescript
fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})
```

## 完了条件
- [ ] ファイルアップロード・ダウンロード動作確認
- [ ] 他orgのファイルにアクセスできないことを確認
- [ ] パストラバーサル対策確認
- [ ] ファイル分析API動作確認
