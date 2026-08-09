# WebAuthn ユーザー認証アプリケーション仕様

本ドキュメントは本プロジェクトの確定仕様です。セッション管理の詳細は [session-management.md](./session-management.md) も参照してください。

## 概要

Astro 7（SSR）+ Hono + Prisma 7 + PostgreSQL + React Islands による、管理者招待制の WebAuthn（パスキー）認証アプリです。

- 初回は仮パスワードでログインし、パスキー登録後はパスキーのみでログインする
- セッションは Cookie + DB（30日スライディング）
- デバイス追加・パスワード再設定・ユーザー招待はメール連携（`MAIL_MODE` で切替）

## 認証フロー

1. 管理者がユーザーを招待すると、サーバーが仮パスワードを自動生成してメール通知し、同時に User を作成する（Credential なし）
2. seed 管理者は環境変数の初期パスワードで作成される
3. **初回のみパスワードログイン** → Session 発行
4. ログイン後に **パスキー必須登録**（未設定中は setup / logout / me 以外不可）
5. Credential が1件以上ある以降は **パスキーログインのみ**（パスワードログインは拒否）
6. **復旧**: パスワード再設定メール → 新パスワード確定時に全パスキー削除＋全 Session 失効 → 自動ログイン → パスキー再登録必須

```text
管理者招待 → 仮パスワードメール → パスワードログイン → パスキー必須登録 → 利用開始
日常: パスキーログイン（または有効 Session）→ Post / デバイス管理
端末追加: 既存端末で再認証 → 招待メール → 新端末でパスキー登録
復旧: forgot → メール → 新パスワード（警告）→ 自動ログイン → パスキー再登録
```

## ロールと権限

| 機能 | user | admin |
|------|------|-------|
| パスワード初回ログイン / パスキー設定 | ○ | ○ |
| パスキーログイン | ○ | ○ |
| パスワード再設定（メール・パスキー全削除） | ○ | ○ |
| 自分のデバイス管理 | ○ | ○ |
| 公開 Post（`published=true`）の閲覧 | ○ | ○ |
| 自分の下書き閲覧 / 自分の Post CRUD | ○ | ○ |
| 他人の下書き閲覧 | × | ○ |
| 他人の Post の書き込み | × | × |
| `/dashboard` | × | ○ |
| ユーザー招待・一覧 | × | ○ |

- ロール値: `admin` / `user`
- 管理者招待時の role 既定は `user`（`admin` は明示選択のみ）

## データモデル

- `User`: id(UUID), email, password(scrypt ハッシュ), name, role
- `WebAuthnCredential`: credentialId, publicKey, counter, transports, deviceName
- `Session`: tokenHash, createdAt, lastUsedAt, revokedAt
- `DeviceInvite`: tokenHash, expiresAt, usedAt
- `PasswordReset`: tokenHash, expiresAt, usedAt
- `Post`: title, content, published, authorId

Session / Invite / Reset のトークンは生値を Cookie・URL・メールにのみ載せ、DB には SHA-256 ハッシュを保存する。

## セッション

| 項目 | 仕様 |
|------|------|
| Cookie 名 | `session` |
| 属性 | HttpOnly / SameSite=Lax / Path=/ / Max-Age=2592000（Secure は本番のみ） |
| 方式 | 永続 Cookie + DB 検証、スライディング 30 日 |
| Session ID | 通常アクセスでは変更しない（期限と lastUsedAt のみ更新） |
| ログアウト | Cookie 削除 + 当該 Session の revokedAt（他デバイス非影響） |

## メール

- `MAIL_MODE=console`: 実送信せずログ出力（ローカル既定）
- `MAIL_MODE=smtp`: nodemailer で実 SMTP 送信
- 対象: ユーザー招待（仮パスワード）、デバイス招待、パスワード再設定

## API 概要

### 認証 `/api/auth`

- `POST /login/password` — Credential 0 件のみ
- `POST /login/passkey/options|verify`
- `POST /passkey/register/options|verify` — 初回のみセッションから直接登録可
- `POST /password-reset/request|confirm`
- `POST /logout` / `GET /me`

### 管理者 `/api/admin`

- `GET /users` / `POST /users`（仮パスワード自動生成＋メール）
- `GET /stats`

### デバイス `/api/devices`

- `GET /` / `DELETE /:id`（最後の1件は削除不可）
- `POST /reauth/options|verify`
- `POST /invite`（再認証必須＋メール）
- `POST /register/options|verify`（招待トークン、ログイン不要）

### 投稿 `/api/posts`

- セッション必須・パスキー設定済み必須
- GET: 公開 Post、または自分の下書き（admin は全件）
- 書き込み: 常に本人のみ

## 環境変数

- `DATABASE_URL`
- `WEBAUTHN_RP_ID` / `WEBAUTHN_RP_NAME` / `WEBAUTHN_ORIGIN`
- `APP_URL`
- `MAIL_MODE` / `SMTP_*`
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`

## セキュリティ上の必須事項

- DeviceInvite / PasswordReset は短命・単回使用（目安: デバイス招待 1h、再設定 1h）
- ログイン・再設定リクエストに簡易レート制限
- パスキー未設定セッションは setup / logout / me 以外を拒否
- 2台目以降のパスキーは再認証＋メール招待のみ
- パスワード再設定 UI で「全パスキー無効化」を警告表示
- 再設定完了時は全 Credential 削除・全 Session 失効・未使用 DeviceInvite 無効化

## トレードオフ

- メール受信箱の侵害はアカウント掌握につながる（メール側保護が前提）
- パスワード再設定は1台紛失でも全パスキーをリセットする（安全側）
