# vrchat-web-rtsp

VRChat 向け WebRTC インジェストアプリ。ブラウザで画面キャプチャを行い、WHIP 経由で [MediaMTX](https://github.com/bluenviron/mediamtx) に配信して RTSP 出力として利用できます。

## 起動

```bash
docker compose up --build
```

| サービス | ポート      | 説明                  |
| -------- | ----------- | --------------------- |
| app      | 3000        | TanStack Start アプリ |
| mediamtx | 8554 / 8889 | RTSP / WHIP サーバー  |

http://localhost:3000 でアクセスできます。

停止:

```bash
docker compose down
```

## 環境変数

### クライアント側（Vite / `.envrc`）

| 変数                       | 説明                              |
| -------------------------- | --------------------------------- |
| `VITE_WHIP_ENDPOINT`       | MediaMTX の WHIP エンドポイント   |
| `VITE_MEDIAMTX_OUTPUT_URL` | RTSP 出力のベース URL             |
| `VITE_SITE_KEY`            | Cloudflare Turnstile サイトキー   |
| `VITE_DEV_SKIP_TURNSTILE`  | クライアント側 Turnstile スキップ |

### サーバー側（Workers / `.dev.vars`）

| 変数                   | 説明                                  |
| ---------------------- | ------------------------------------- |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile シークレットキー |
| `DEV_SKIP_TURNSTILE`   | サーバー側 Turnstile スキップ         |

本番運用時は Turnstile キーを設定し、スキップを無効にしてください。

## その他のコマンド

```bash
pnpm install
pnpm run dev       # Docker 外で開発サーバーを起動
pnpm run test      # 通常テスト
pnpm run test:workers
pnpm run build
pnpm run deploy
```

## ライセンス

MIT
