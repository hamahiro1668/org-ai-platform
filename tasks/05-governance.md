# Task 05: AIガバナンス

## 前提条件
- Task 03 (LLMルーター) 完了済み

## 目標
AIログ監視、リスク検知、ガバナンスダッシュボード用APIを実装する。

## 成果物

### 1. リスク検知エンジン
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/ai-engine/app/governance/risk_detector.py`

検知ルール:
- **PII漏洩**: PIIスクリーナーの結果を受け取り記録
- **有害コンテンツ**: キーワードリスト + LLMによる判定
- **異常検知**: 短時間での大量リクエスト (レート: 60req/min超)
- **コスト異常**: トークン使用量が1リクエスト4000超

リスクスコア: 0.0〜1.0 (0.7超でHIGH, 0.9超でCRITICAL)

### 2. ガバナンスAPI (api-gateway)
`/Users/hamadahiromu/Desktop/AiProject/org-ai-platform/apps/api-gateway/src/routes/governance.ts`

エンドポイント (ADMIN/OWNER権限必須):
- `GET /api/governance/logs` — AIログ一覧 (ページネーション、フィルター)
- `GET /api/governance/logs/:id` — ログ詳細
- `GET /api/governance/risks` — リスクイベント一覧
- `PATCH /api/governance/risks/:id/resolve` — リスクイベント解決
- `GET /api/governance/stats` — 統計情報

統計情報レスポンス:
```json
{
  "totalRequests": 1234,
  "totalTokens": 567890,
  "riskEvents": { "LOW": 10, "MEDIUM": 3, "HIGH": 1, "CRITICAL": 0 },
  "topDepartments": [{ "department": "SALES", "count": 500 }],
  "avgLatencyMs": 1200
}
```

### 3. AIログ記録の強化
`apps/ai-engine/app/governance/audit_logger.py`

全LLM呼び出しに対して自動記録:
- 入力テキスト (PIIマスク済み)
- 出力テキスト
- 使用モデル、トークン数、レイテンシ
- リスクスコア
- 部署、組織ID

## 完了条件
- [ ] 全LLM呼び出しがai_logsに記録される
- [ ] リスクイベントが自動生成される
- [ ] ガバナンスAPIが正常動作
