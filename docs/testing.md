# テスト方法

## 自動テスト

Vitest で純関数テストと Hono API スモークテストを実行できます。DB はモックし、実 PostgreSQL / Playwright / パスキー UI は使いません。

```bash
pnpm install
pnpm test
```

開発中のウォッチ実行:

```bash
pnpm test:watch
```

### 対象

- `src/server/auth/*.test.ts` — パスワード・トークン・レート制限・チャレンジなどの純関数
- `src/server/api/app.test.ts` — `app.request()` による API スモーク（未認証応答など）

## 静的チェック

```bash
pnpm lint
pnpm build
```

- `pnpm lint` — ESLint
- `pnpm build` — Astro SSR ビルドが通るかの確認

## 手動検証

### 前提

```bash
pnpm install
# .env.example を .env にコピーして DATABASE_URL 等を設定
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`http://localhost:3000` で起動します。seed 管理者（`.env` の `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`）でパスワードログインし、パスキーを登録してください。

ローカルでは `MAIL_MODE=console` のため、招待・再設定メールはサーバーログに出力されます。

WebAuthn はブラウザのパスキー UI が必要です（`localhost` + `WEBAUTHN_RP_ID=localhost` でローカル検証を想定）。

### 確認フロー

| 流れ | 画面 / API |
|------|------------|
| 初回パスワードログイン → パスキー登録 | `/login` → `/setup-passkey` |
| 以降のパスキーログイン | `/login` |
| 管理者によるユーザー招待 | `/admin/users`（ログの招待リンク） |
| デバイス追加 | `/devices` → `/invite/device/[token]` |
| パスワード再設定 | `/forgot-password` → `/reset-password/[token]` |
| 投稿の閲覧・作成 | `/posts` |
| 管理者ダッシュボード | `/dashboard` |
