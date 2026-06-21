# vrchat-web-rtsp

VRChat 向け WebRTC ingest アプリです。ブラウザで画面キャプチャを行い、WHIP 経由で MediaMTX に配信して RTSP 出力として利用します。

この repository はアプリ本体を管理します。本番の Droplet、Caddy、MediaMTX、DNS、Terraform state などのホスト運用は別の infra repository で管理します。

## Local Development

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

`docker-compose.yml` と `mediamtx.yml` は local dev 用です。本番の MediaMTX/Caddy 設定はこの repository では管理しません。

## App Deploy

Cloudflare Workers へのアプリ deploy は Wrangler が担当します。

```bash
pnpm install
pnpm run types
pnpm run build
pnpm run deploy
```

本番の `TURNSTILE_SECRET_KEY` は Wrangler secret として設定してください。

```bash
wrangler secret put TURNSTILE_SECRET_KEY
```

## Environment Variables

### Client

| 変数                       | 説明                            |
| -------------------------- | ------------------------------- |
| `VITE_WHIP_ENDPOINT`       | MediaMTX の WHIP endpoint base  |
| `VITE_MEDIAMTX_OUTPUT_URL` | RTSP 出力 URL の base           |
| `VITE_SITE_KEY`            | Cloudflare Turnstile site key   |
| `VITE_DEV_SKIP_TURNSTILE`  | local dev 用 Turnstile skip flag |

### Server

| 変数                   | 説明                                  |
| ---------------------- | ------------------------------------- |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key       |
| `DEV_SKIP_TURNSTILE`   | local dev 用 Turnstile skip flag      |

本番運用時は Turnstile key を設定し、skip flag を無効にしてください。

## External Infra Contract

本番 infra が満たすべき app 側の契約は [docs/deployment-contract.md](docs/deployment-contract.md) にまとめています。

この repository に残す本番運用の境界は次の範囲です。

- Worker script と Durable Object の deploy
- `/api/mediamtx/auth` の API contract
- frontend が参照する WHIP/RTSP URL の env contract
- local dev 用の Docker Compose

## Other Commands

```bash
pnpm run dev
pnpm run test
pnpm run test:workers
pnpm run check
```

## License

MIT
