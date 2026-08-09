# セッション管理仕様

本ファイルは `planning/specification.txt` の内容をドキュメントとして整理したものです。

## 1. 認証方式

認証には WebAuthn を使用します（初回のみパスワードログイン後にパスキーへ移行）。

```text
WebAuthn Credential
        ↓
    本人確認
        ↓
   Session発行
        ↓
   Cookieに保存
```

WebAuthn の Credential と Session は別物として管理します。

## 2. ログイン時

認証に成功したら新しい Session を発行します。

```text
認証成功
    ↓
User特定
    ↓
ランダムな Session Token 生成
    ↓
DB に Token のハッシュを保存
    ↓
Cookie 発行
```

- Session Token は暗号学的に安全な乱数から生成する
- DB には生の Token ではなくハッシュを保存する

```text
Session
├─ id
├─ userId
├─ tokenHash
├─ createdAt
├─ lastUsedAt
└─ revokedAt
```

## 3. セッション Cookie

永続 Cookie とします。

```http
HttpOnly
Secure（本番のみ）
SameSite=Lax
Path=/
Max-Age=2592000
```

`Max-Age=2592000` は 30 日です。ブラウザを閉じても Cookie は残ります。

## 4. セッションの有効期間

スライディング方式です。最後にアクセスしてから 30 日間アクセスがなければログインを要求します。

通常アクセスでは Session ID 自体は変更せず、Cookie の有効期限と `lastUsedAt` のみ更新します。

## 5. サーバー側検証

Cookie だけを信頼せず、リクエストごとに DB で Session を検証します。

```text
Cookie
  ↓
Session検索
  ↓
revokedAt を確認
  ↓
lastUsedAt を確認
  ↓
30日以上経過？
  ├─ YES → Session無効 → ログイン要求
  └─ NO  → 認証済み
```

## 6. ログアウト

Cookie 削除と、DB 上の当該 Session の失効（`revokedAt`）を行います。他デバイスの Session には影響しません。

## 7. 複数デバイス

ユーザーは複数の WebAuthn Credential と複数の Session を持てます。デバイス追加はメール招待方式とし、招待発行時は既存 WebAuthn による再認証を要求します。
