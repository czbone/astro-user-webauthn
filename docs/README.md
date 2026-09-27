# ドキュメント

| ファイル | 内容 |
|----------|------|
| [specification.md](./specification.md) | 本アプリの確定仕様（認証・権限・API・環境変数） |
| [session-management.md](./session-management.md) | セッション管理の詳細仕様 |
| [redis.md](./redis.md) | Redis キー設計・TTL・環境変数・障害時の挙動 |
| [testing.md](./testing.md) | テスト方法（`pnpm test` / `pnpm test:integration`・静的チェック・手動検証） |

実装メモ（確定仕様ではない）:

| ファイル | 内容 |
|----------|------|
| [notes/chrome-passkey-transports.md](./notes/chrome-passkey-transports.md) | Chrome で空のパスキー一覧が出る件。`allowCredentials` から `transports` を外した理由 |

補足の下書きは `planning/specification.md` にも残していますが、実装の正本は本ディレクトリです。
