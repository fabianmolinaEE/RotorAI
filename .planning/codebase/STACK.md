# Technology Stack

**Analysis Date:** 2026-06-02

## Languages

**Primary:**
- TypeScript 5.8 - All source files in `src/` (`.ts` and `.tsx`)

**Secondary:**
- CSS - Global styles in `src/styles.css` (Tailwind v4 utility classes + CSS variables)

## Runtime

**Environment:**
- Bun (package manager and runtime; lockfile present at `bun.lock`)
- Target: Cloudflare Workers via Nitro (SSR server entry)

**Package Manager:**
- Bun (configured in `bunfig.toml`)
- Lockfile: `bun.lock` present

## Frameworks

**Core:**
- React 19 - UI rendering (`react`, `react-dom`)
- TanStack Start 1.167 - Full-stack SSR framework (`@tanstack/react-start`) — replaces Next.js
- TanStack Router 1.168 - File-based routing with type-safe routes (`@tanstack/react-router`)
- TanStack Query 5.83 - Server-state management and caching (`@tanstack/react-query`)

**UI Component System:**
- shadcn/ui - Component library scaffolded into `src/components/ui/` (style: "new-york", base color: slate)
- Radix UI - Headless primitives underlying shadcn (full suite: accordion, dialog, dropdown, etc.)
- Tailwind CSS v4 - Utility-first styling via `@tailwindcss/vite` plugin
- lucide-react 0.575 - Icon library

**Build/Dev:**
- Vite 7 - Dev server and bundler
- `@lovable.dev/vite-tanstack-config` - Lovable platform opinionated Vite config (wraps tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro, componentTagger, env injection, @ alias)
- Nitro 3 (beta) - SSR/edge server adapter; default target is Cloudflare Workers
- `@tanstack/router-plugin` - Auto-generates `src/routeTree.gen.ts` from `src/routes/`

## Key Dependencies

**Critical:**
- `zod` ^3.24 - Schema validation and input sanitization for server functions (`src/lib/api/example.functions.ts`)
- `react-hook-form` ^7.71 + `@hookform/resolvers` ^5.2 - Form state management and zod integration
- `class-variance-authority` ^0.7 - Variant-based component styling throughout `src/components/ui/`
- `tailwind-merge` ^3.5 - Merges conflicting Tailwind classes (`src/lib/utils.ts`)
- `clsx` ^2.1 - Conditional class name utility

**UI Extras:**
- `recharts` ^2.15 - Charts (used in `src/components/ui/chart.tsx`)
- `sonner` ^2.0 - Toast notifications (`src/components/ui/sonner.tsx`)
- `vaul` ^1.1 - Drawer component (`src/components/ui/drawer.tsx`)
- `cmdk` ^1.1 - Command palette (`src/components/ui/command.tsx`)
- `date-fns` ^4.1 - Date formatting utilities
- `react-day-picker` ^9.14 - Calendar / date picker
- `embla-carousel-react` ^8.6 - Carousel component
- `react-resizable-panels` ^4.6 - Resizable panel layouts
- `input-otp` ^1.4 - OTP input component

**Linting/Formatting (devDependencies):**
- ESLint 9 with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-prettier`
- Prettier 3.7 - Code formatting

## Configuration

**Environment:**
- No `.env` file detected in repository root
- Public client config: `import.meta.env.VITE_FOO` pattern (see `src/lib/config.server.ts` comments)
- Server-only secrets: `process.env.*` accessed inside request handlers via `src/lib/config.server.ts:getServerConfig()`
- Currently only `NODE_ENV` is wired; stubs for `DATABASE_URL`, `STRIPE_SECRET_KEY` shown in comments
- On Cloudflare Workers, env binds at request time — module-scope `process.env` reads return undefined

**Build:**
- `vite.config.ts` — delegates entirely to `@lovable.dev/vite-tanstack-config`; server entry overridden to `src/server.ts`
- `tsconfig.json` — ES2022 target, strict mode, `@/*` path alias maps to `src/`
- `bunfig.toml` — 24h supply-chain guard via `minimumReleaseAge = 86400`
- `eslint.config.js` — flat config, bans `server-only` npm package (Next.js-ism), enforces react-hooks rules
- `components.json` — shadcn/ui config (style: new-york, icon lib: lucide, aliases wired to `@/`)

## Platform Requirements

**Development:**
- Bun runtime required (not npm/yarn)
- `bun run dev` → starts Vite dev server

**Production:**
- Cloudflare Workers (Nitro default target)
- SSR entry: `src/server.ts` wraps `@tanstack/react-start/server-entry`
- Middleware entry: `src/start.ts` registers error-handling middleware via `createStart`

---

*Stack analysis: 2026-06-02*
