# DURABLE OBJECTS KNOWLEDGE BASE

## OVERVIEW
`src/durable-objects` defines the Room durable-object runtime and its typed client contract.

## STRUCTURE
```text
durable-objects/
├── Room.ts         # Durable Object runtime + SQL operations
├── Room.types.ts   # Shared Zod schemas and error union
├── wrapper.ts      # Result-based client adapter
└── wrapper.test.ts # Contract tests with storage shim
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Room runtime behavior | `Room.ts` | Hono routes + SQLite table ops |
| Contract schemas/types | `Room.types.ts` | key/value/error Zod models |
| Client wrapper | `wrapper.ts` | `Result`-based API for callers |
| Storage contract tests | `wrapper.test.ts` | in-memory SQL shim + behavior checks |

## CONVENTIONS
- Durable Object class is exported as `Room` and bound via Wrangler `ROOM`.
- Constructor initializes schema with `CREATE TABLE IF NOT EXISTS rooms ...`.
- HTTP responses use `{ ok: true, value? } | { ok: false, error }` envelope.
- Input validation is done with `zValidator` and schema reuse from `Room.types.ts`.
- External callers use `RoomStore` methods (`get`, `create`, `remove`) returning `neverthrow Result`.

## ANTI-PATTERNS
- Do not change error literals (`bad-request`, `unavailable`, `internal-server-error`) without updating all consumers.
- Do not bypass shared schemas when editing key/value formats.
- Do not add direct route-to-DO fetch logic that duplicates `RoomStore`.
- Do not edit SQL column names without synchronized migration and wrapper updates.

## NOTES
- `RoomStore` is the integration seam expected by routes and server functions.
- Keep response envelope shape stable to avoid runtime parse drift.
