# AGENTS.md - VRChat Web RTSP

This document provides essential guidelines for AI coding agents working in this repository.

## Project Overview

A VRChat WebRTC streaming application built with TanStack Start, deployed on Cloudflare Workers. Users can share their screen via WebRTC (WHIP protocol) and receive a 4-digit code for stream identification.

## Technology Stack

- **Framework**: TanStack Start (React 19.2.0 with React Compiler)
- **Router**: TanStack Router (file-based routing)
- **Data Fetching**: TanStack React Query
- **Validation**: Zod v4
- **Error Handling**: neverthrow (Result type)
- **Build Tool**: Vite 7
- **Deployment**: Cloudflare Workers + Durable Objects
- **Styling**: Tailwind CSS v4 + DaisyUI v5
- **Animation**: Motion (framer-motion)
- **Package Manager**: Bun

## Build/Lint/Test Commands

```bash
# Development
bun run dev              # Start dev server on port 3000

# Build
bun run build            # Production build
bun run preview          # Preview production build

# Linting & Formatting (Biome)
bun run lint             # Run linter
bun run format           # Run formatter
bun run check            # Run both lint and format

# Testing (Vitest)
bun run test             # Run all tests
bunx vitest run <file>   # Run a single test file
bunx vitest run -t "test name"  # Run tests matching pattern
bunx vitest --watch      # Watch mode

# Deployment
bun run deploy           # Build and deploy to Cloudflare
```

## Project Structure

```
src/
├── components/          # React UI components
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home page
│   └── api.$.ts         # API routes
├── durable-objects/     # Cloudflare Durable Objects
├── integrations/        # External library integrations
├── lib/                 # Client-side utilities
├── utils/               # Server-side utilities
│   └── *.functions.ts   # Server functions (createServerFn)
└── data/                # Static data files
```

## Code Style Guidelines

### Formatting (Biome)

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for JavaScript/TypeScript
- **Semicolons**: Required
- **Trailing commas**: ES5 style
- **Line width**: Default (80 characters)

### Imports

Order imports as follows (Biome auto-organizes):

1. External packages (react, @tanstack/*, etc.)
2. Internal aliases (@/components, @/lib, etc.)
3. Relative imports (./*, ../*)

```typescript
// External
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

// Internal aliases
import { SlotDisplay } from "@/components/SlotDisplay";
import { generateCode } from "@/lib/code-generator";
import { verifySession } from "@/utils/newSession.functions";
```

### Path Aliases

Use the `@/` alias for src imports:

```typescript
// Good
import { utils } from "@/lib/utils";

// Avoid
import { utils } from "../../lib/utils";
```

### TypeScript

- **Strict mode** is enabled
- No unused locals or parameters allowed
- Use explicit type annotations for function parameters
- Prefer `interface` for object shapes, `type` for unions/intersections

```typescript
// Interface for props
interface SlotDisplayProps {
	started: boolean;
	code: string;
}

// Type for unions
type ErrorCode = "invalid-input" | "timeout" | "internal-error";
```

### Naming Conventions

- **Components**: PascalCase (`SlotDisplay.tsx`, `StartButton.tsx`)
- **Hooks**: camelCase with `use` prefix (`useReducedMotion`)
- **Utilities**: camelCase (`generateCode`, `copyToClipboard`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_WHIP_ENDPOINT_BASE`)
- **Server functions**: Named exports in `*.functions.ts` files

### React Components

- Use function components exclusively
- Use React Compiler (no manual memoization needed in most cases)
- Destructure props in function signature

```typescript
export function SlotDisplay({ started, code }: SlotDisplayProps) {
	const reduceMotion = useReducedMotion();
	const chars = useMemo(() => code.split(""), [code]);
	// ...
}
```

### Error Handling

Use `neverthrow` Result type for operations that can fail:

```typescript
import { err, ok, type Result } from "neverthrow";

async function validateTurnstile(
	token: string,
	remoteip: string | undefined,
): Promise<Result<TurnstileResponse, ErrorCode>> {
	// Return ok() for success
	if (data.success) {
		return ok(data);
	}
	// Return err() for failure
	return err("internal-error");
}

// Handle Result with .match()
const result = turnstileResult.match(
	(ok) => ok,
	(e) => { throw e; },
);
```

### Validation with Zod

Use Zod v4 for input validation:

```typescript
import { z } from "zod";

const TurnStileInput = z.object({
	token: z.string().max(2048),
});

// Use with server functions
export const verifySession = createServerFn({ method: "POST" })
	.inputValidator(TurnStileInput)
	.handler(async ({ data }) => {
		// data is typed from Zod schema
	});
```

### Server Functions

Place server functions in `src/utils/*.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const verifySession = createServerFn({ method: "POST" })
	.inputValidator(schema)
	.handler(async ({ data }) => {
		const ip = getRequestHeader("CF-Connecting-IP");
		// Server-side logic
	});
```

### Routes (TanStack Router)

- Routes are in `src/routes/`
- Use `createFileRoute` for page routes
- Use `createRootRouteWithContext` for root layout

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: StreamingCodePage,
});

function StreamingCodePage() {
	// Component implementation
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Use DaisyUI components where appropriate
- Prefer `className` over inline styles

```tsx
<div className="min-h-dvh bg-white grid place-items-center">
	<div className="flex items-center gap-4">
		{/* content */}
	</div>
</div>
```

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

- `src/routeTree.gen.ts` - Auto-generated by TanStack Router
- `src/styles.css` - May contain auto-generated content
- `.wrangler/` - Wrangler cache
- `.tanstack/` - TanStack cache
- `dist/` - Build output
