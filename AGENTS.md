# AGENTS.md - VRChat Web RTSP
Guidance for agentic coding assistants working in this repository.

## Project Overview
- VRChat WebRTC streaming app built with TanStack Start.
- Users share a screen via WHIP and receive 4-digit session codes.
- Deploys to Cloudflare Workers + Durable Objects.

## Tech Stack
- Framework: TanStack Start (React 19 + React Compiler)
- Router: TanStack Router (file-based routes)
- Data: TanStack React Query
- Validation: Zod v4
- Errors: neverthrow Result
- Build: Vite 7
- Styling: Tailwind CSS v4 + DaisyUI v5
- Animation: Motion (framer-motion)
- Package Manager: Bun

## Build / Lint / Test Commands
```bash
# Setup
bun install
# Development
bun run dev              # dev server on :3000
# Build
bun run build            # production build
bun run preview          # preview build
# Linting & formatting (Biome)
bun run lint             # lint only
bun run format           # format only
bun run check            # lint + format
# Tests (Vitest)
bun run test             # run all tests
bunx vitest run path/to/file.test.ts
bunx vitest run -t "test name"
bunx vitest run --coverage
bunx vitest --watch
# Deployment
bun run deploy           # build + wrangler deploy
```

## Project Structure
- `src/components/` UI components
- `src/routes/` pages and API routes (TanStack file router)
- `src/durable-objects/` Cloudflare Durable Objects
- `src/integrations/` external service adapters
- `src/lib/` shared client helpers (ex: WHIP, class name helper)
- `src/utils/` server utilities and `*.functions.ts`
- `src/data/` static data

## Code Style
### Formatting (Biome)
- Tabs for indentation; no spaces
- Double quotes; semicolons required
- Trailing commas (ES5)
- Organize imports on format
- Biome runs on `src`, `.vscode`, `index.html`, `vite.config.ts`

### Imports
- Order: external packages → `@/` aliases → relative
- Prefer `@/` path alias for `src`
- Avoid `../../` when alias works
- Use `import type` for type-only imports
```ts
import { createFileRoute } from "@tanstack/react-router";
import type { RoomStub } from "@/durable-objects/Room";
import { Turnstile } from "@/components/Turnstile";
import { parseCode } from "./parseCode";
```

### Naming Conventions
- Components: PascalCase (`ScreenCaptureButton.tsx`)
- Hooks: `use` prefix (`useReducedMotion`)
- Utilities: camelCase (`generateRandomCode`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_WHIP_ENDPOINT_BASE`)
- Server functions: named exports in `*.functions.ts`
- Server-only modules: `*.server.ts`

### TypeScript
- `strict` mode on; no unused locals/params
- Add explicit types for function parameters when inference is unclear
- Prefer `interface` for object shapes
- Prefer `type` for unions/intersections
- Avoid `any`; use `unknown` + narrowing
- Use literal unions for error codes when possible
```ts
interface TurnstileProps {
	onSuccess: (token: string) => void;
	onExpired?: () => void;
}

type ErrorCode = "timeout-or-duplicate" | "internal-error";
```

### React Components
- Function components only
- Destructure props in the signature
- React Compiler enabled (avoid manual memoization)
- Keep hooks top-level, no conditional hooks
- Return `null` for optional UI (no empty fragments)

### Server Functions (TanStack Start)
- Place server functions in `src/utils/*.functions.ts`
- Use `createServerFn` + Zod input validation
- Read IP from `CF-Connecting-IP` or `X-Forwarded-For`
- Throw only at the API boundary; prefer `Result` internally
```ts
export const verifySession = createServerFn({ method: "POST" })
	.inputValidator(schema)
	.handler(async ({ data }) => {
		const ip = getRequestHeader("CF-Connecting-IP");
		return { ip, data };
	});
```

### Durable Objects (Hono)
- `src/durable-objects/Room.ts` uses Hono + `zValidator`
- Keep request validation in Zod schemas in `Room.types.ts`
- Return JSON `{ ok: true, value? }` or `{ ok: false, error }`
- `RoomStore` wraps DO calls and returns `Result`

### Validation (Zod)
- Use Zod v4 for inputs and API payloads
- Keep schemas near functions that use them
- Prefer `safeParse` and handle `success` explicitly
- For discriminated unions, use `z.discriminatedUnion`

### Error Handling (neverthrow)
- Use `Result` for fallible operations
- Return `ok()` for success, `err()` for failure
- Handle results with `.match()` or `isOk`/`isErr`
- Avoid throwing across module boundaries unless integrating with a library

### Routing (TanStack Router)
- Routes live in `src/routes/`
- Use `createFileRoute` for pages
- Root layout uses `createRootRouteWithContext`
- Provide typed router context (ex: `QueryClient`)

### Styling
- Tailwind utility classes + DaisyUI components
- Prefer `className`, avoid inline styles
- Use `cn` helper from `src/lib/utils.ts` for class merging
- Use Motion for animation (fade/slide variants are favored)

### Data Fetching
- Prefer TanStack React Query for async data and caching
- Use `neverthrow` results in query functions and map to UI states

### Tests
- Vitest for unit tests (`*.test.ts`)
- Use `vi.mock` for `cloudflare:workers` and other globals
- Prefer explicit expectations in `.match()` branches

### Files and Generated Artifacts
- Do not edit generated files (`src/routeTree.gen.ts`, `src/styles.css`)
- Keep deployment output (`dist/`, `.wrangler/`, `.tanstack/`) out of commits

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
