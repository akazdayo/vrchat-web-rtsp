# AGENTS.md - VRChat Web RTSP
Guidance for agentic coding assistants working in this repository.

## Project Overview
- VRChat WebRTC streaming app built with TanStack Start.
- Users share a screen via WHIP and receive 4-digit session codes.
- Deploys to Cloudflare Workers + Durable Objects; MediaMTX handles RTSP/WHIP.

## Tech Stack
- TanStack Start (React 19 + React Compiler), TanStack Router, React Query
- Zod v4 for validation, neverthrow Result for errors
- Vite 7 build, Tailwind CSS v4 + DaisyUI v5 styling
- Motion (framer-motion) animations, Bun package manager

## Build / Lint / Test Commands
```bash
bun install
bun run dev              # dev server on :3000
bun run build            # production build
bun run preview          # preview build
bun run lint             # lint only
bun run format           # format only
bun run check            # lint + format
bun run test             # run all tests
bunx vitest run path/to/file.test.ts
bunx vitest run -t "test name"
bun run deploy           # build + wrangler deploy
```

## Project Structure
- `src/components/` UI components
- `src/routes/` pages + API routes (TanStack file router)
- `src/durable-objects/` MediaMTXバックエンドのルーム管理 (Hono)
- `src/integrations/` external service adapters
- `src/lib/` shared client helpers (WHIP, class name helper)
- `src/utils/` server utilities and `*.functions.ts`
- `src/data/` static data
- `wrangler.jsonc` Workers/DO config; custom domain matches `infra/cloudflare`

## Infrastructure (`infra/`)
- `infra/cloudflare/` Terraform: Workers custom domain + Turnstile widget
- `cloudflare_workers_custom_domain` binds `worker_service` to `worker_hostname`
- `cloudflare_turnstile_widget` outputs sitekey/secret for env vars
- `infra/digitalocean-min/` Terraform: NixOS droplet + firewall (22/80/443/8554)
- Uses custom NixOS image and `terraform-do-modules/droplet`
- `nix/mediamtx.nix` enables WHIP/RTSP with `/api/mediamtx/auth`
- `nix/caddy.nix` terminates TLS for `webrtc.odango.app` → 8889
- `nix/flake.nix` defines deploy-rs node `do-1`
- Terraform state and `.terraform/` exist; avoid committing changes there

## Media Flow
- WHIP ingest uses `VITE_WHIP_ENDPOINT` and `createWhipClient` in `src/lib/whip.ts`.
- RTSP output URLs are built from `VITE_MEDIAMTX_OUTPUT_URL`.
- MediaMTX auth hits `/api/mediamtx/auth`, which checks room codes.
- Room codes are stored in the `Room` Durable Object (SQLite).

## Code Style
### Formatting (Biome)
- Tabs; double quotes; semicolons; ES5 trailing commas
- Biome includes `src`, `.vscode`, `index.html`, `vite.config.ts`
- Generated excludes: `src/routeTree.gen.ts`, `src/styles.css`

### Imports
- Order: external → `@/` aliases → relative
- Prefer `@/` for `src`, avoid deep relative paths
- Use `import type` for type-only imports
```ts
import { createFileRoute } from "@tanstack/react-router";
import type { RoomStub } from "@/durable-objects/Room";
import { Turnstile } from "@/components/Turnstile";
import { parseCode } from "./parseCode";
```

### Naming Conventions
- Components PascalCase, hooks `use*`, utilities camelCase
- Constants UPPER_SNAKE_CASE; server fns `*.functions.ts`
- Server-only modules use `*.server.ts`

### TypeScript
- `strict` mode, no unused locals/params
- Explicit param types when inference is unclear
- `interface` for shapes, `type` for unions/intersections
- Avoid `any`; use `unknown` + narrowing; prefer literal unions
```ts
interface TurnstileProps {
	onSuccess: (token: string) => void;
	onExpired?: () => void;
}
type ErrorCode = "timeout-or-duplicate" | "internal-error";
```

### React Components
- Function components only; destructure props in signature
- React Compiler enabled (avoid manual memoization)
- Hooks top-level only; return `null` for optional UI

### Server Functions (TanStack Start)
- Place in `src/utils/*.functions.ts`, validate input with Zod
- Use `createServerFn`; IP from `CF-Connecting-IP`/`X-Forwarded-For`
- Throw only at API boundary; use Result internally
```ts
export const verifySession = createServerFn({ method: "POST" })
	.inputValidator(schema)
	.handler(async ({ data }) => ({ data }));
```

### Durable Objects (Hono)
- `Room.ts` uses Hono + `zValidator`; schemas in `Room.types.ts`
- Responses `{ ok: true, value? }` or `{ ok: false, error }`
- `RoomStore` wraps DO calls and returns Result

### Validation / Error Handling
- Zod v4; prefer `safeParse`; use `z.discriminatedUnion`
- neverthrow `Result`, `ok`/`err`, handle with `match` or `isOk`/`isErr`

### Routing (TanStack Router)
- Routes live in `src/routes/`
- Use `createFileRoute` for pages
- Root layout uses `createRootRouteWithContext`
- Provide typed router context (ex: `QueryClient`)

### Styling
- Tailwind + DaisyUI; prefer `className` and `cn` helper
- Use Motion for animation (fade/slide variants favored)

### Data Fetching
- TanStack React Query for async data + caching
- Map `Result` states to UI (success/error/loading)

### Tests
- Vitest for `*.test.ts`
- Use `vi.mock` for `cloudflare:workers` and other globals
- Prefer explicit expectations in Result `.match()` branches

### Files and Generated Artifacts
- Do not edit `src/routeTree.gen.ts`, `src/styles.css`
- Keep `dist/`, `.wrangler/`, `.tanstack/` out of commits

## Environment Variables
```bash
# Client-side (VITE_ prefix required)
VITE_WHIP_ENDPOINT=http://localhost:8889
VITE_MEDIAMTX_OUTPUT_URL=rtsp://localhost:8554
VITE_SITE_KEY=your-turnstile-site-key
# Server-side (Cloudflare Workers)
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
```

## Cursor / Copilot Rules
- No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` found.
