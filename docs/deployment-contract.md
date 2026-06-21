# Deployment Contract

This repository owns the Cloudflare Workers app and its MediaMTX-facing API contract. Production host infrastructure, including MediaMTX, Caddy, DNS, Droplets, firewalls, TLS material, and Terraform state, should live in an external infra repository.

## App Surface

The production app is deployed as a Cloudflare Worker via Wrangler.

Required Worker resources:

- Durable Object binding: `ROOM`
- Durable Object class: `Room`
- Durable Object SQLite migration tag: `v1`
- Secret: `TURNSTILE_SECRET_KEY`

The public Worker hostname is configured in `wrangler.jsonc`. External infra may reference that hostname, but should not manage the Worker script lifecycle from this app repository.

## MediaMTX Auth Callback

MediaMTX must call the app auth endpoint:

```text
POST https://<worker-hostname>/api/mediamtx/auth
Content-Type: application/json
```

The handler accepts MediaMTX auth payloads as loose JSON and currently reads these fields:

| Field    | Required | Description                              |
| -------- | -------- | ---------------------------------------- |
| `action` | yes      | MediaMTX action, such as `read` or `publish` |
| `path`   | publish  | Session code path used for publish auth  |

Response envelope:

```json
{ "ok": true }
```

or:

```json
{ "ok": false }
```

Current behavior:

| Action    | Result |
| --------- | ------ |
| `read`    | Always allowed with `200 { "ok": true }` |
| `publish` | Allowed only when `path` matches an existing session code in the `ROOM` Durable Object |
| other     | Rejected with `401 { "ok": false }` |

Successful `publish` auth consumes the session code by removing it from the Durable Object. This is intentional: session codes are single-use.

## Media Endpoints

The frontend builds its WHIP publish URL as:

```text
${VITE_WHIP_ENDPOINT}/${sessionCode}/whip
```

The frontend displays its RTSP output URL as:

```text
${VITE_MEDIAMTX_OUTPUT_URL}/${sessionCode}
```

Production infra must expose compatible MediaMTX endpoints and allow browser WHIP publishing from the Worker app origin. A working deployment needs both the WHIP HTTP endpoint and the WebRTC ICE transport path:

- The WHIP endpoint must accept `POST /${sessionCode}/whip` from browsers loaded from the Worker app origin.
- MediaMTX must advertise the public WebRTC host that browsers can reach.
- MediaMTX must expose its ICE listener over both UDP and TCP on the configured WebRTC ICE port. The previous in-repo deployment used `8189` for both transports.

Proxying only the WHIP HTTP endpoint is not enough. The WHIP request can succeed while the peer connection still times out if browsers cannot reach the advertised ICE UDP/TCP listener.

Example production values:

```dotenv
VITE_WHIP_ENDPOINT=https://webrtc.example.com
VITE_MEDIAMTX_OUTPUT_URL=rtsp://media.example.com:8554
```

Local defaults are:

```dotenv
VITE_WHIP_ENDPOINT=http://localhost:8889
VITE_MEDIAMTX_OUTPUT_URL=rtsp://localhost:8554
```

## Turnstile

The app expects:

| Variable | Runtime | Description |
| -------- | ------- | ----------- |
| `VITE_SITE_KEY` | client build | Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Worker secret | Turnstile secret key |
| `VITE_DEV_SKIP_TURNSTILE` | client build | local dev skip flag |
| `DEV_SKIP_TURNSTILE` | Worker runtime | local dev skip flag |

Production must set the real Turnstile keys and leave both skip flags disabled.

## Local Development Only

`docker-compose.yml` and `mediamtx.yml` are local development fixtures. They are allowed to differ from production host implementation as long as they continue to satisfy the same app contract.
