# Task 06: フロントエンド

## 前提条件
- Task 02 (認証API) 完了済み

## 目標
React 18 + Vite + TypeScriptでSPAを構築する。

## 技術スタック
- React 18, Vite, TypeScript (strict)
- Zustand (状態管理)
- React Router v6
- TanStack Query v5 (データフェッチ)
- Tailwind CSS + shadcn/ui (UI)

## 成果物

### ページ構成
```
/login          — ログイン
/register       — 新規登録
/               — ダッシュボード (認証必須)
/chat           — チャット画面 (メイン機能)
/chat/:id       — チャットセッション
/tasks          — タスク一覧
/governance     — ガバナンスダッシュボード (OWNER権限)
/settings       — 設定
```

### コンポーネント

#### チャット画面 (`/chat`)
- 左サイドバー: セッション一覧
- メインエリア: メッセージ履歴 + 入力欄
- 部署バッジ表示 (どの部署AIが応答したか)
- WebSocketでリアルタイム応答表示
- ストリーミング表示 (タイピングアニメーション)

#### ダッシュボード (`/`)
- 今日のタスク数、AIリクエスト数
- 部署別使用状況グラフ (recharts)
- 最近のリスクイベント

#### ガバナンス画面 (`/governance`)
- AIログテーブル (ページネーション)
- リスクイベント一覧
- フィルター: 部署、日付範囲、リスクレベル
- 統計カード

### Zustand Store
```
authStore: { user, token, login(), logout() }
chatStore: { sessions, currentSession, messages, sendMessage() }
```

### APIサービス層
`src/services/`
- `api.ts` — axiosインスタンス、JWT自動付与、エラーハンドリング
- `auth.service.ts` — 認証API
- `chat.service.ts` — チャットAPI
- `governance.service.ts` — ガバナンスAPI

### apps/web/package.json
```
依存:
- react, react-dom, react-router-dom
- zustand, @tanstack/react-query
- axios
- tailwindcss, @tailwindcss/vite
- recharts
- lucide-react

開発依存:
- vite, @vitejs/plugin-react
- typescript, @types/react, @types/react-dom
```

## 完了条件
- [ ] ログイン/登録が動作
- [ ] チャット画面でメッセージ送受信動作
- [ ] ダッシュボードにデータ表示
- [ ] ガバナンス画面でログ閲覧可能
