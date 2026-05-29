# SERVER UTILS KNOWLEDGE BASE

## OVERVIEW
`src/utils` contains server-side utilities for session issuance and Turnstile verification.

## STRUCTURE
```text
utils/
├── newSession.functions.ts  # Session code creation server fn
├── turnstile.server.ts      # Turnstile verification logic
├── turnstile.server.test.ts # Verification tests
└── types/turnstile.ts       # Turnstile response types
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Session issuance | `newSession.functions.ts` | `createServerFn` + room creation |
| Turnstile verification | `turnstile.server.ts` | secret use + API response mapping |
| Turnstile tests | `turnstile.server.test.ts` | fetch stubs + error-path coverage |
| Turnstile response types | `types/turnstile.ts` | payload typing surface |

## CONVENTIONS
- Server actions use `createServerFn({ method: "POST" })` with Zod input validators.
- Client IP extraction checks `CF-Connecting-IP` then `X-Forwarded-For`.
- Turnstile failures are normalized to stable error codes.
- Room creation writes to DO via `RoomStore` after verification success.
- Tests mock `cloudflare:workers` and replace `globalThis.fetch` explicitly.

## ANTI-PATTERNS
- Do not read `TURNSTILE_SECRET_KEY` from client-exposed code.
- Do not return unvalidated Turnstile payloads to route/UI boundaries.
- Do not introduce `any`-typed escape hatches around API responses.
- Do not skip failure-path assertions in `Result` branches.

## NOTES
- `newSession.functions.ts` depends on stable room key semantics from DO schemas.
- Keep secret/env failures explicit and test-covered.
