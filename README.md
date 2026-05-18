# 就活トラッカー（Shukatsu Tracker）

> 28卒のための、選考管理 SaaS。<br>
> Notion とスプレッドシートに分散していた就活情報をひとつに統合します。

複数社並行する選考フローを一枚のダッシュボードで管理し、ES・面接ログ・ケース面接の振り返り、企業比較、リマインダー、AI 要約までカバー。Google OAuth でユーザーごとにデータが分離されるマルチテナント設計。

---

## 主な機能

- **企業管理** — 一覧／カンバン／詳細ページ、ステージ管理、ステータス推移
- **カレンダー** — 面接・締切・OB訪問・イベントを一元表示（ICS 書き出し対応）
- **タスク管理** — 締切ベースの ToDo、企業ひも付け、ポモドーロタイマー
- **エントリーシート** — 設問ごとの文字数カウント、提出ステータス、テンプレ流用
- **面接ログ** — 質問・回答・面接官情報・自己評価をレーダーチャートで可視化
- **ケース面接練習** — お題・前提・構造化・分析・結論を残し、難易度・評価で振り返る
- **OB訪問** — トピック、得たインサイト、お礼メール送信状況
- **企業比較** — 複数社を並べて比較する 2-up / 3-up ビュー
- **メールテンプレート** — 辞退・調整・お礼・依頼の雛形（テンプレ変数対応）
- **キャリア軌跡** — インターン、ゼミ、コンテスト、受賞の時系列
- **AI要約** — Anthropic API で面接振り返り・ES添削（任意）
- **コマンドパレット** — `Cmd+K` で全機能に即アクセス

## 技術スタック

| Layer | 技術 |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui (Radix UI), Lucide React, Sonner |
| State | Zustand, react-hook-form + zod |
| DnD / Cmd-K | @dnd-kit, cmdk |
| Charts | Recharts |
| Backend | Next.js Route Handlers / Server Actions |
| ORM | Prisma 7 |
| DB | SQLite（開発）/ Turso（本番）, Supabase（オプション） |
| Auth | NextAuth.js v5 + Prisma Adapter（Google OAuth） |
| AI | Anthropic API（オプション） |
| Deploy | Vercel |

---

## ローカル起動

```bash
# 依存インストール
npm install

# 環境変数（最小構成は SQLite + local モードで起動可能）
cp .env.example .env.local

# DB 初期化 + デモシード
npx prisma migrate dev
npm run db:seed

# 開発サーバー
npm run dev
```

`http://localhost:3000` を開く。

### 認証モード

`.env.local` の `NEXT_PUBLIC_AUTH_MODE` で切り替え：

- `"local"` — 認証を bypass し、`demo user` として全機能を体験できる開発モード
- `"auth"` — Google OAuth を有効化（`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 要設定）

---

## ディレクトリ構成（抜粋）

```
src/
├── app/
│   ├── (auth)/          # サインインページ
│   ├── (main)/          # ダッシュボード以下の認証必要ページ
│   └── api/             # Route Handlers
├── components/
│   ├── ui/              # shadcn/ui
│   ├── companies/
│   ├── calendar/
│   ├── cases/
│   ├── interviews/
│   ├── entry-sheets/
│   └── ...
├── lib/
│   ├── db.ts            # Prisma Client（singleton）
│   ├── auth.ts          # NextAuth 設定
│   ├── validators/      # zod スキーマ
│   └── constants.ts
└── middleware.ts
```

---

## デモシードについて

`prisma/seed.ts` には公開用のサンプルデータが入っています。会社名・人名・メール・電話番号はすべて**架空のもの**で、実在の選考や個人情報は含まれません。本番運用時は `db:seed` を実行せず、Google ログイン後に UI から自分のデータを登録してください。

---

## ライセンス

MIT
