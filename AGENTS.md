# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-27 00:54:34 JST
**Commit:** 30987dc
**Branch:** main

## OVERVIEW
VRChat WebRTC ingest app built with TanStack Start on Cloudflare Workers.
Session codes are persisted in a Durable Object and consumed by MediaMTX auth.

## STRUCTURE
```text
vrchat-web-rtsp/
├── src/                               # App + worker runtime code
│   ├── routes/                        # File routes + embedded /api handlers
│   ├── durable-objects/               # Room Durable Object + wrapper contract
│   └── utils/                         # Server functions + Turnstile integration
├── docs/
│   └── deployment-contract.md         # Contract expected by external infra
├── wrangler.jsonc                     # Worker entrypoint + DO binding + route
├── mediamtx.yml                       # Local dev MediaMTX config
└── docker-compose.yml                 # Local dev runtime
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Root document and router context | `src/routes/__root.tsx` | HTML shell + Turnstile script |
| Broadcast/session UX | `src/routes/index.tsx` | Turnstile gate + WHIP start |
| MediaMTX auth endpoint | `src/routes/api.$.ts` | `/api/mediamtx/auth` flow |
| Durable Object runtime | `src/durable-objects/Room.ts` | Hono + SQLite storage |
| Durable Object adapter | `src/durable-objects/wrapper.ts` | `Result`-based error surface |
| Session creation server fn | `src/utils/newSession.functions.ts` | `createServerFn` + room creation |
| Turnstile verification | `src/utils/turnstile.server.ts` | Secret/env + error mapping |
| Worker runtime/deploy config | `wrangler.jsonc` | entry, assets, migrations |
| External infra contract | `docs/deployment-contract.md` | MediaMTX/Turnstile/env expectations |

## CONVENTIONS
- Biome is the only formatter/linter (`biome.json`), with tabs and double quotes.
- Local `pnpm run test` uses Vitest threads for stability; CI keeps Cloudflare Workers pool coverage via `pnpm run test:workers`.
- Path alias is `@/* -> src/*` in TS, Vite, and Vitest.
- Wrangler deploys worker code; production host infrastructure lives outside this repo.

## ANTI-PATTERNS (THIS PROJECT)
- Do not edit generated artifacts: `src/routeTree.gen.ts`, `src/styles.css`, `worker-configuration.d.ts`.
- Do not commit transient/build artifacts: `dist/`, `.wrangler/`, `.tanstack/`.
- Do not change `/api/mediamtx/auth` semantics without updating `docs/deployment-contract.md`.
- Do not bypass `RoomStore` contract for route-to-DO interactions.

## UNIQUE STYLES
- API handling is Hono embedded inside TanStack file routes (`src/routes/api.$.ts`).
- Durable Object endpoints return `{ ok: true|false }` payload envelopes.
- Server utilities model recoverable failures with `neverthrow Result`.

## COMMANDS
```bash
pnpm install
pnpm run dev
pnpm run check
pnpm run build
pnpm run test
pnpm run test:workers
pnpm run types
pnpm run deploy
```

## NOTES
- Domain-specific child guides:
  - `src/routes/AGENTS.md`
  - `src/durable-objects/AGENTS.md`
  - `src/utils/AGENTS.md`
- CI sequence: install (`--frozen-lockfile`) -> `pnpm run types` -> build -> test.
- LSP symbol server was unavailable in this environment; code-map decisions use grep + AST + explore evidence.
