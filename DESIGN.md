# FLOW Design System — Liquid Glass Prism

> **目的**: このドキュメントは `org-ai-platform` のデザインシステムの単一の情報源です。
> 複数のAIエージェント/モデルで作業する場合でも、この契約に従うことでUIの一貫性を保ちます。
> コードを書く前に必ずこのドキュメントを読み、ここで定義されたトークンとコンポーネントを使ってください。

---

## 1. Philosophy — "Liquid Glass Prism"

ほぼ純白の少しだけ温かみを帯びたキャンバスに、**自然な虹（プリズム）** のパステルアクセントを添えるライトモード。雨上がりの朝の光、visionOS 的な半透明ガラス層、白い紙の上で光が分散するイメージ。

### 3つの原則

| 原則 | 意味 |
|---|---|
| **White Canvas (白のキャンバス)** | 背景は純白にほんの少しクリーム/ピーチを混ぜたウォームホワイト。冷たくも眩しくもない紙のような質感。 |
| **Natural Rainbow (ナチュラル虹)** | アクセントはプリズム (coral / peach / gold / mint / sky / lavender)。彩度は抑えめで、パステルの帯として現れる。 |
| **Clarity (明瞭性)** | 装飾に溺れない。テキストは常に4.5:1以上のコントラストを確保する。 |

---

## 2. Color Tokens

### 2.1 Base (背景/キャンバス)

| Token | Hex | 用途 |
|---|---|---|
| `bg-canvas` | `#FFFCF7` | ページ背景 (最下層、ほんのりクリームを帯びた白) |
| `bg-elevated` | `#FFFFFF` | カード/パネル背景 (glass tint と重ねる) |
| `bg-muted` | `#F6F1EA` | disabled/hover/muted surface |
| `bg-overlay` | `rgba(30, 24, 16, 0.32)` | モーダル背景 |

### 2.2 Text

| Token | Hex | 用途 |
|---|---|---|
| `text-primary` | `#1F1B16` | 見出し・主要テキスト |
| `text-secondary` | `#6E6558` | 補助テキスト |
| `text-muted` | `#A59B8C` | プレースホルダー・弱いラベル |
| `text-inverse` | `#FFFCF7` | 濃い背景上のテキスト |
| `text-accent` | `#C2410C` | リンク・強調 (controlled warmth) |

### 2.3 Accent (ナチュラル虹プリズム)

| Token | Hex / gradient | 用途 |
|---|---|---|
| `rainbow-coral` | `#FFB5A7` | 虹アクセント1 (最暖) |
| `rainbow-peach` | `#FFD6A5` | 虹アクセント2 |
| `rainbow-gold` | `#FDFFB6` | 虹アクセント3 |
| `rainbow-mint` | `#CAFFBF` | 虹アクセント4 |
| `rainbow-sky` | `#9BF6FF` | 虹アクセント5 |
| `rainbow-lavender` | `#BDB2FF` | 虹アクセント6 (最冷) |
| `rainbow-rose` | `#FFC6FF` | 虹アクセント7 |
| `accent-primary` | `#F59E6D` | 単色フォールバック (warm peach) |
| `accent-gradient` | `linear-gradient(135deg, #FFB5A7 0%, #FFD6A5 20%, #FDFFB6 38%, #CAFFBF 55%, #9BF6FF 72%, #BDB2FF 88%, #FFC6FF 100%)` | 虹のフルグラデ (primaryボタン・AI中央) |
| `accent-gradient-soft` | `linear-gradient(135deg, #FFB5A755 0%, #FFD6A555 25%, #CAFFBF55 50%, #9BF6FF55 75%, #BDB2FF55 100%)` | 背景オーラ・ボーダーティント |
| `accent-glow` | `rgba(255, 182, 147, 0.35)` | glow shadow |

**Rule**: ベタ塗りの原色は使わない。虹はすべて `accent-gradient` 系のグラデーション経由で使用する。

### 2.4 Department Colors

| 部署 | Hex | 名前 |
|---|---|---|
| SALES | `#F59E6D` | Warm Peach |
| MARKETING | `#D7A7FF` | Lilac |
| ACCOUNTING | `#FFC971` | Honey |
| ANALYTICS | `#9DB5FF` | Sky Iris |
| GENERAL | `#8FE5C6` | Mint Jade |
| ASSISTANT | `#FFB5C5` | Rose |

使用: `tone` prop で Glass コンポーネントに渡す。直接Hexを書かない。

### 2.5 Semantic

| Token | Hex | 用途 |
|---|---|---|
| `success` | `#6BCB77` | 完了・成功 |
| `warning` | `#F9C74F` | 警告 |
| `danger` | `#F07167` | エラー・削除 |
| `info` | `#8ECAE6` | 情報 |

### 2.6 Glass Tones (半透明)

| Token | rgba | 用途 |
|---|---|---|
| `glass-tint-thin` | `rgba(255, 255, 255, 0.55)` | blur-md と組み合わせる |
| `glass-tint-regular` | `rgba(255, 255, 255, 0.70)` | 標準ガラス層 |
| `glass-tint-thick` | `rgba(255, 255, 255, 0.82)` | 濃いガラス層 |
| `glass-tint-chrome` | `rgba(255, 255, 255, 0.92)` | モーダル/ナビ |
| `glass-border-soft` | `rgba(255, 255, 255, 0.60)` | ガラス境界 (subtle) |
| `glass-border-bright` | `rgba(255, 255, 255, 0.92)` | ガラス境界 (bright top edge) |
| `glass-highlight` | `rgba(255, 255, 255, 0.45)` | inset 内側ハイライト |
| `glass-shadow` | `rgba(120, 80, 40, 0.08)` | ウォームグレーの外側シャドウ |

---

## 3. Typography

### 3.1 Font Families

- **Sans** (body): `'Noto Sans JP', system-ui, sans-serif`
- **Display** (hero見出し): `'Playfair Display', serif`
- **Mono** (code/logs): `'JetBrains Mono', ui-monospace, monospace`

### 3.2 Scale

| Token | Size | Line | 用途 |
|---|---|---|---|
| `text-display` | 48px | 1.1 | ヒーロー見出し |
| `text-h1` | 32px | 1.2 | ページタイトル |
| `text-h2` | 24px | 1.3 | セクションタイトル |
| `text-h3` | 20px | 1.4 | カードタイトル |
| `text-body` | 15px | 1.6 | 本文 |
| `text-sm` | 13px | 1.5 | 補助テキスト |
| `text-xs` | 11px | 1.4 | ラベル・バッジ |
| `text-micro` | 10px | 1.3 | マイクロテキスト |

### 3.3 Weight

- `font-normal` (400) — 本文
- `font-medium` (500) — 補助見出し
- `font-semibold` (600) — カードタイトル
- `font-bold` (700) — ページタイトル・強調

---

## 4. Spacing

4px グリッド。直接 `p-[17px]` のような奇数値を書かない。

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |

---

## 5. Radius

| Token | Value | 用途 |
|---|---|---|
| `rounded-xs` | 8px | バッジ・chip |
| `rounded-sm` | 12px | ボタン |
| `rounded-md` | 16px | 小型カード |
| `rounded-lg` | 20px | 標準カード |
| `rounded-xl` | 28px | 大型カード・パネル |
| `rounded-2xl` | 36px | ヒーローカード |
| `rounded-full` | 9999px | ピル・丸アバター |

---

## 6. Glass Surfaces — 4段階

すべてのサーフェスは以下4つのいずれかに分類されます。`GlassCard` / `GlassPanel` の `variant` prop で指定。

| Variant | blur | bg (tint) | border | shadow | 用途 |
|---|---|---|---|---|---|
| `thin` | 8px (backdrop-blur-thin) | `glass-tint-thin` | `glass-border-soft` | `elev-1` | 軽いリスト項目・bubble |
| `regular` | 16px (backdrop-blur-regular) | `glass-tint-regular` | `glass-border-soft` | `elev-2` | 標準カード (最も多用) |
| `thick` | 24px (backdrop-blur-thick) | `glass-tint-thick` | `glass-border-bright` | `elev-3` | ヒーロー・フォーカスカード |
| `chrome` | 32px (backdrop-blur-chrome) | `glass-tint-chrome` | `glass-border-bright` | `elev-4` | TopBar・BottomNav・モーダル |

すべてのガラスは上辺 1px の `glass-border-bright` でハイライトを作ること (`border-t`)。

---

## 7. Shadows & Depth

ティールグレー系の柔らかい影。純黒は使わない。

| Token | Value |
|---|---|
| `shadow-elev-0` | `none` |
| `shadow-elev-1` | `0 1px 2px rgba(45, 100, 95, 0.06), 0 1px 4px rgba(45, 100, 95, 0.04)` |
| `shadow-elev-2` | `0 2px 8px rgba(45, 100, 95, 0.08), 0 4px 16px rgba(45, 100, 95, 0.05)` |
| `shadow-elev-3` | `0 8px 24px rgba(45, 100, 95, 0.10), 0 16px 40px rgba(45, 100, 95, 0.06)` |
| `shadow-elev-4` | `0 16px 44px rgba(45, 100, 95, 0.12), 0 28px 72px rgba(45, 100, 95, 0.08)` |
| `shadow-glass-inset` | `inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 0 rgba(45, 100, 95, 0.05)` |
| `shadow-glow-primary` | `0 0 40px rgba(20, 184, 166, 0.32)` |

---

## 8. Motion

### 8.1 Duration

| Token | Value | 用途 |
|---|---|---|
| `duration-fast` | 150ms | hover/tap反応 |
| `duration-base` | 250ms | 標準トランジション |
| `duration-slow` | 400ms | パネル展開・ページ遷移 |
| `duration-dramatic` | 700ms | ヒーロー演出 |

### 8.2 Easing

| Token | Value |
|---|---|
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` (overshoot) |
| `ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` |

### 8.3 Spring Presets (framer-motion)

```tsx
const spring = {
  soft: { type: 'spring', stiffness: 200, damping: 25 },
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  bouncy: { type: 'spring', stiffness: 300, damping: 15 },
};
```

---

## 9. Ambient Background

すべてのページの背景に `<AmbientBackground />` を配置。fixed 位置、z-index -1。

### 構成

- Base: `bg-canvas` 系グラデーション（`#F2F9F7` → `#E8F6F3` → `#F0FAF8`）
- Orb 1: mint `#5EEAD4`, ~580px, top-left, `blur-3xl`
- Orb 2: aqua `#67E8F9`, ~520px, bottom-right, `blur-3xl`
- Orb 3: soft lime `#A7F3D0`, ~480px, mid-right, `blur-3xl`
- Orb 4: soft violet `#DDD6FE`, ~420px, bottom-left, `blur-3xl`
- Blend mode: `multiply` + opacity 低め（清涼感）
- Animation: 既存 aurora drift（`prefers-reduced-motion: reduce` で停止）

---

## 10. Core Components

すべてのコンポーネントは `apps/web/src/components/ui/` に配置。直接 HTML タグに Tailwind を書かず、これらを使うこと。

### 10.1 `<GlassCard>`

標準的なガラスカード。

```tsx
import { GlassCard } from '@/components/ui/GlassCard';

<GlassCard variant="regular" tone="SALES" interactive>
  <h3>内容</h3>
</GlassCard>
```

**Props:**
- `variant`: `'thin' | 'regular' | 'thick' | 'chrome'` (default: `'regular'`)
- `tone?`: department key for color tint (`'SALES' | 'MARKETING' | ...`)
- `interactive?`: boolean — hover時に lift + glow
- `as?`: polymorphic element
- `className?`: 追加スタイル (トークンのみ使用)

### 10.2 `<GlassButton>`

```tsx
<GlassButton variant="primary" size="md" icon={<Send />}>
  送信
</GlassButton>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'glass' | 'danger'`
- `size`: `'xs' | 'sm' | 'md' | 'lg'`
- `tone?`: department key
- `icon?`: ReactNode (前置)
- `loading?`: boolean (spinner)

### 10.3 `<GlassInput>`

```tsx
<GlassInput value={v} onChange={setV} placeholder="..." prefix={<Search />} />
```

`<textarea>` は `<GlassInput multiline />`。

### 10.4 `<GlassBadge>`

```tsx
<GlassBadge tone="SALES" size="sm">営業部</GlassBadge>
```

**Props:** `variant` (`'solid' | 'glass' | 'outline'`), `size`, `tone`

### 10.5 `<GlassPanel>`

大型ガラスサーフェス。サイドバー・ドロワー・モーダルに使用。

```tsx
<GlassPanel side="right" open={true} onClose={...}>
  ...
</GlassPanel>
```

上辺に `glass-border-bright` の reflection line あり。

### 10.6 `<GlassNav>` + `<GlassNavItem>`

```tsx
<GlassNav orientation="horizontal">
  <GlassNavItem active icon={<Home />} label="ホーム" to="/" />
</GlassNav>
```

`layoutId` でアクティブ indicator がスムーズに遷移。

### 10.7 `<AmbientBackground>`

引数なし。`<Layout>` に1回だけ配置。

---

## 11. Layout Templates

`apps/web/src/templates/` に配置。ページ作成時はまずテンプレートを選ぶ。

### 11.1 `<AppShell>`

標準アプリシェル。TopBar + メインエリア + BottomNav + AmbientBackground。

```tsx
<AppShell>
  <YourPageContent />
</AppShell>
```

### 11.2 `<CenteredGlassLayout>`

認証・シンプルフォーム用。AmbientBackground + 中央GlassPanel。

### 11.3 `<SplitPanelLayout>`

左サイドバー + メイン + 右パネル (ChatPage用)。

```tsx
<SplitPanelLayout
  leftPanel={<Sessions />}
  rightPanel={<TaskProgress />}
  rightOpen={showTaskSidebar}
>
  <ChatMain />
</SplitPanelLayout>
```

### 11.4 `<GridBoardLayout>`

DnD対応のグリッドボード (DeliverablesPage用)。

### 11.5 `<DashboardTemplate>`

Hero + Stats + Carousel パターン。

---

## 12. Do's and Don'ts

### ✅ Do

- `<GlassCard>` / `<GlassButton>` 等のプリミティブを使う
- トークン (`tone`, `variant`, `size`) で調整する
- department color は `tone` prop で指定する
- 影は `shadow-elev-*` のみ使う
- アニメーション duration は `duration-*` トークンを使う
- テンプレートから始めて差分を書く

### ❌ Don't

- 直接 `bg-white`, `bg-gray-100` を書かない (常に Glass 系を使う)
- 直接 Hex値 (`#E8863A`) を JSX に書かない (トークン経由)
- カスタム `box-shadow: ...` を書かない (`shadow-elev-*` を使う)
- 固定 px 値のスペーシング (`p-[17px]`) を書かない
- グレースケールのテキスト (`text-gray-500`) を使わない (`text-secondary` を使う)
- 複数のガラス層を不必要にネストしない (最大2層)
- `backdrop-blur` を直接書かない (`variant` prop で指定)

---

## 13. Migration Checklist

既存コンポーネントを更新する際の対応表。

| Before | After |
|---|---|
| `<div className="bg-white rounded-2xl shadow-sm p-4">` | `<GlassCard variant="regular">` |
| `<div className="bg-white/60 backdrop-blur-lg ...">` | `<GlassCard variant="thin">` または `<GlassPanel>` |
| `<button className="bg-[#E8863A] text-white ...">` | `<GlassButton variant="primary">` |
| `<input className="bg-white border ...">` | `<GlassInput>` |
| `<span className="bg-[#E8863A]/15 text-[#E8863A] ...">` | `<GlassBadge tone="SALES">` |
| `className="text-[#2D2D2D]"` | `className="text-primary"` |
| `className="text-[#8A8A8A]"` | `className="text-secondary"` |
| `className="text-[#BCBCBC]"` | `className="text-muted"` |
| `className="bg-[#faf9f7]"` / 旧ウォームキャンバス | `className="bg-canvas"`（`#F2F9F7`） |
| `className="border-[#eae8e3]"` | トークン経由 (通常 GlassCard 内部で自動適用) |
| `transition-all duration-300` | `transition-all duration-base` |

---

## 14. File Structure

```
apps/web/src/
├── components/
│   ├── ui/                    # Glass primitives (触るときは必ずDESIGN.md確認)
│   │   ├── GlassCard.tsx
│   │   ├── GlassButton.tsx
│   │   ├── GlassInput.tsx
│   │   ├── GlassBadge.tsx
│   │   ├── GlassPanel.tsx
│   │   ├── GlassNav.tsx
│   │   └── AmbientBackground.tsx
│   ├── Navigation/
│   ├── Dashboard/
│   ├── Chat/
│   ├── TaskManager/
│   └── Deliverables/
├── templates/                 # Layout templates
│   ├── AppShell.tsx
│   ├── CenteredGlassLayout.tsx
│   ├── SplitPanelLayout.tsx
│   ├── GridBoardLayout.tsx
│   └── DashboardTemplate.tsx
├── constants/
│   └── departments.ts         # 部署色マップ (このファイル以外で Hex を書かない)
├── store/
└── pages/
```

---

## 15. Quick Start — 新しいページを作る

1. `apps/web/src/templates/` から適切なテンプレートを選ぶ (多くは `AppShell`)
2. テンプレートで `<YourPage />` をラップ
3. 内容は `<GlassCard>` / `<GlassButton>` / `<GlassInput>` を組み合わせて構成
4. 色は必ず `tone` prop で指定 (department key)
5. スペーシングは 4px グリッドに従う
6. 変更後 `npx vite build` でエラー0を確認

---

**このドキュメントは生きた契約書です。**
新しいパターンが必要になったら、まずここに追記してからコードに反映してください。
