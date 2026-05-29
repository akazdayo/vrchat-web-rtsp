# ROUTES KNOWLEDGE BASE

## OVERVIEW
`src/routes` owns both UI routes and the `/api` handler surface.

## STRUCTURE
```text
routes/
├── __root.tsx      # Root document/shell
├── index.tsx       # Broadcast page route
├── api.$.ts        # Catch-all API route (/api/*)
└── -api.$.test.ts  # API route behavior tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Root shell and scripts | `__root.tsx` | document, global script, devtools |
| User broadcast flow | `index.tsx` | capture + Turnstile + WHIP start |
| MediaMTX callback auth | `api.$.ts` | Hono app mounted at `/api` |
| Route-level API tests | `-api.$.test.ts` | mocks `cloudflare:workers` + wrapper |

## CONVENTIONS
- File routes use `createFileRoute` and route path literals (`"/"`, `"/api/$"`).
- `/api/$` delegates all HTTP methods to a single Hono app instance.
- Validation uses Zod `safeParse` before room-key lookups.
- DO access in routes goes through `RoomStore`, not raw SQL.
- Error HTTP codes map from durable-object error unions.

## ANTI-PATTERNS
- Do not break `read` vs `publish` gate behavior in `/api/mediamtx/auth`.
- Do not alter room key format checks without updating `Room.types.ts`.
- Do not couple UI route logic to Cloudflare env bindings directly.
- Do not duplicate DO fetch/error mapping already centralized in `RoomStore`.

## NOTES
- `api.$.ts` is operationally coupled to MediaMTX auth callbacks.
- Keep route-level tests co-located for auth contract changes.
