# AGENTS.md - VRChat Web RTSP
Guidance for agentic coding assistants working in this repository.

## Project Overview
- VRChat WebRTC streaming app built with TanStack Start.
- Users share screen via WHIP and receive 4-digit codes.
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
- `src/routes/` pages and API routes
- `src/durable-objects/` Cloudflare Durable Objects
- `src/integrations/` external service adapters
- `src/lib/` client-side helpers
- `src/utils/` server utilities and `*.functions.ts`
- `src/data/` static data

## Code Style
### Formatting (Biome)
- Tabs for indentation; no spaces
- Double quotes; semicolons required
- Trailing commas (ES5)
- Organize imports on format

### Imports
- Order: external packages → `@/` aliases → relative
- Prefer `@/` path alias for `src`
- Avoid `../../` when alias works
```ts
import { createFileRoute } from "@tanstack/react-router";
import { SlotDisplay } from "@/components/SlotDisplay";
import { parseCode } from "./parseCode";
```

### Naming Conventions
- Components: PascalCase (`SlotDisplay.tsx`)
- Hooks: `use` prefix (`useReducedMotion`)
- Utilities: camelCase (`generateCode`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_WHIP_ENDPOINT`)
- Server functions: named exports in `*.functions.ts`

### TypeScript
- `strict` mode on; no unused locals/params
- Add explicit types for function parameters
- Prefer `interface` for object shapes
- Prefer `type` for unions/intersections
- Avoid `any`; use `unknown` + narrowing
```ts
interface SlotDisplayProps {
	started: boolean;
	code: string;
}

type ErrorCode = "invalid-input" | "timeout" | "internal-error";
```

### React Components
- Function components only
- Destructure props in the signature
- React Compiler enabled (avoid manual memoization)
- Keep hooks top-level, no conditional hooks

### Server Functions
- Place server functions in `src/utils/*.functions.ts`
- Use `createServerFn` + Zod input validation
- Read IP from `CF-Connecting-IP` when needed
```ts
export const verifySession = createServerFn({ method: "POST" })
	.inputValidator(schema)
	.handler(async ({ data }) => {
		const ip = getRequestHeader("CF-Connecting-IP");
		return { ip, data };
	});
```

### Validation (Zod)
- Use Zod v4 for inputs and API payloads
- Keep schemas near functions that use them

### Error Handling (neverthrow)
- Use `Result` for fallible operations
- Return `ok()` for success, `err()` for failure
- Handle results with `.match()`
- Avoid throwing across module boundaries unless integrating with library APIs

### Routing (TanStack Router)
- Routes live in `src/routes/`
- Use `createFileRoute` for pages
- Root layout uses `createRootRouteWithContext`

### Styling
- Tailwind utility classes, DaisyUI components
- Prefer `className`, avoid inline styles
- Use Motion for animation (fade/slide variants are favored)

### Data Fetching
- Prefer TanStack React Query for async data and caching
- Use `neverthrow` results in query functions and map to UI states

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

## Files to Ignore
- `src/routeTree.gen.ts` (generated)
- `src/styles.css` (generated)
- `.wrangler/`, `.tanstack/`, `dist/`

## Cursor / Copilot Rules
- No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` found.
