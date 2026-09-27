# Chrome で空のパスキー一覧が出る件

ログインの `allowCredentials` から `transports` を外した。資格情報 ID は残す。データベースに保存した `transports` と、署名検証でサーバが使う `transports` は変えていない。

## 現象

Chrome でログアウトしたあと、メールアドレスを入れて「パスキーでログイン」を押すと、Windows の入力画面の代わりに「利用可能なパスキーがありません」が出ることがあった。その画面を閉じると `NotAllowedError` になる。同じボタンをもう一度押すと、Windows の入力画面が出てログインできた。Edge では最初から Windows の入力画面が出た。

この表示はアプリの待機メッセージではない。`navigator.credentials.get()` の途中で Chrome が出す空の選択画面で、閉じるまで Promise は終わらない。サーバの `/login/passkey/verify` には届かない。

確認できた内容は次のとおり。

- 渡していた資格情報は 1 件で、`transports` が付いていた
- 失敗はブラウザの儀式側（`NotAllowedError`）。チャレンジの不一致や未登録ではない
- 2 回目は同じ資格情報 ID で成功した

## 原因

Chrome は `allowCredentials` の `transports` をヒントではなく絞り込みに使う。登録時に保存した値（多くの場合 `internal` を含む）で候補が 0 件だと、空の選択画面を出す。Edge は同じ一覧でも Windows Hello に渡す。

ログアウト処理はセッションの破棄と `/login` への遷移だけで、この表示の原因ではない。

## 修正

`src/server/auth/webauthn.ts` の `toCredentialDescriptor` は `{ id: credentialId }` だけを返す。次のブラウザ向け一覧がこれを使う。

- ログインの `allowCredentials`（`createAuthenticationOptions`）
- 再認証の `allowCredentials`（`createReauthOptions`）
- 登録時の `excludeCredentials`（`createRegistrationOptions`）

ID を残すので、入力したメールアドレスの資格情報以外は認証器が返さない。`allowCredentials` 自体は外していない。外すと、同じサイトの別パスキーで別ユーザーのセッションができうる。その場合は、チャレンジに紐づくユーザーとアサーションの資格情報のユーザーが一致することを検証側で必須にする必要がある。今回はそこまでしていない。

登録時の `transports` は引き続き `WebAuthnCredential.transports` に保存する。`verifyAuthentication` と `verifyReauth` は、その値を検証ライブラリへ渡す。

様子見のために `LoginForm` へ出していた `[passkey-login]` のコンソールログと、「もう一度押してください」という案内は、修正後の確認が取れたので削除した。
