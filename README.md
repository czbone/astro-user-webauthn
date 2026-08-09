# Astro User WebAuthn

Astro 7（SSR）+ Hono + Prisma 7 + PostgreSQL による、管理者招待制のパスキー（WebAuthn）認証アプリケーションです。

詳細仕様は [`docs/specification.md`](docs/specification.md) と [`docs/session-management.md`](docs/session-management.md) を参照してください。テスト方法は [`docs/testing.md`](docs/testing.md) を参照してください。

## 主な機能

- 管理者招待（仮パスワード自動生成＋メール通知）
- 初回パスワードログイン → パスキー必須登録 → 以降パスキーログイン
- セッション（Cookie + DB、30日スライディング）
- デバイス追加（再認証＋メール招待）
- パスワード再設定（全パスキー削除＋全 Session 失効）
- 投稿（公開は全員閲覧、書き込みは本人のみ）
- 管理者ダッシュボード / ユーザー管理

## 技術スタック

- Astro 7（SSR / Node adapter / Advanced routing）
- Hono
- Prisma 7 + PostgreSQL
- React 19 Islands
- Tailwind CSS 4
- `@simplewebauthn/server` / `@simplewebauthn/browser`
- nodemailer（`MAIL_MODE=console|smtp`）

## セットアップ

### 1. 依存関係

```bash
pnpm install
```

### 2. 環境変数

`.env.example` をコピーして `.env` を作成します。

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
APP_URL="http://localhost:3000"
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_RP_NAME="Astro User WebAuthn"
WEBAUTHN_ORIGIN="http://localhost:3000"
MAIL_MODE="console"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="admin-change-me"
```

### 3. DB 初期化

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. 開発サーバー

```bash
pnpm dev
```

`http://localhost:3000` で起動します。seed 管理者でパスワードログインし、パスキーを登録してください。

ローカルでは `MAIL_MODE=console` のため、招待・再設定メールはサーバーログに出力されます。

## 主な画面

| パス | 説明 |
|------|------|
| `/login` | ログイン |
| `/setup-passkey` | 初回パスキー登録 |
| `/posts` | 投稿 |
| `/devices` | デバイス管理 |
| `/dashboard` | 管理者ダッシュボード |
| `/admin/users` | ユーザー招待・一覧 |
| `/forgot-password` / `/reset-password/[token]` | パスワード再設定 |
| `/invite/device/[token]` | デバイス用パスキー登録 |

## API

- `/api/auth/*` — 認証・パスキー・再設定
- `/api/admin/*` — 管理者
- `/api/devices/*` — デバイス
- `/api/posts/*` — 投稿

## アーキテクチャ

1. `src/fetch.ts` — `middleware()` → `/api`（Hono）→ `pages()`
2. Cookie は `App.getSetCookieFromResponse()` で明示付与
3. ブラウザ API は `src/api-client` 経由
4. DB アクセスは `src/server/db` 経由

## テスト

詳細は [`docs/testing.md`](docs/testing.md) を参照してください。

### 自動テスト

```bash
pnpm test
```

Vitest で純関数テストと API スモーク（DB モック）を実行します。ウォッチ実行は `pnpm test:watch` です。

### 静的チェック

```bash
pnpm lint
pnpm build
```

### 手動検証

セットアップ後に `pnpm dev` で起動し、seed 管理者でログインしてパスキーを登録したうえで、主要フロー（招待・デバイス追加・再設定・投稿など）をブラウザで確認します。`MAIL_MODE=console` のときは招待・再設定リンクがサーバーログに出ます。

## 本番メール

```env
MAIL_MODE="smtp"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="noreply@example.com"
```
