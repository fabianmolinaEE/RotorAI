# External Integrations

**Analysis Date:** 2026-06-02

## APIs & External Services

**Lovable Platform:**
- Lovable.dev - Host/scaffolding platform that provides the opinionated Vite config and dev tooling
  - SDK/Client: `@lovable.dev/vite-tanstack-config` (devDependency)
  - Error reporting bridge: `src/lib/lovable-error-reporting.ts` — calls `window.__lovableEvents?.captureException` injected by the Lovable runtime
  - No auth token required in application code; platform-injected at runtime

**Fonts (Google Fonts CDN):**
- Google Fonts - Inter typeface loaded via CDN link tags
  - Endpoint: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
  - Preconnect origins: `https://fonts.googleapis.com`, `https://fonts.gstatic.com`
  - Configured in `src/routes/__root.tsx` head links
  - No auth required

## Data Storage

**Databases:**
- None connected. All data served by `src/data/mockDataService.ts` (in-memory mock).
- The `DataService` interface in `src/data/dataService.ts` is designed as a swap point: call `setDataService(impl)` to replace the mock with a real backend implementation.
- `src/lib/config.server.ts` contains a commented stub for `DATABASE_URL` — no ORM or database client installed.

**File Storage:**
- None. No S3, R2, or local file storage integration present.

**Caching:**
- TanStack Query (`@tanstack/react-query`) provides in-process client-side cache.
  - `QueryClient` instantiated in `src/router.tsx`, provided via `QueryClientProvider` in `src/routes/__root.tsx`.
  - No external cache layer (Redis, Memcached, etc.).

## Authentication & Identity

**Auth Provider:**
- None. No auth library (Clerk, Auth.js, Supabase Auth, etc.) is installed.
- Role simulation is handled entirely client-side via React Context (`src/app/RoleContext.tsx`).
  - Roles: `owner`, `manager`, `technician`, `customer`
  - Active role persisted to `localStorage` under key `haw.role`
  - Role switching UI in `src/components/role-switcher.tsx`
- No protected routes, JWT validation, or session management.

## Monitoring & Observability

**Error Tracking:**
- Lovable error reporting bridge — `src/lib/lovable-error-reporting.ts`
  - Reports React error boundary exceptions to `window.__lovableEvents?.captureException`
  - Used in `src/routes/__root.tsx` `ErrorComponent`
  - Only active in browser context; no-ops on server

**Server-side error capture:**
- `src/lib/error-capture.ts` — captures the last thrown error so `src/server.ts` can recover h3-swallowed SSR 500 responses
- Not an external service; in-process mechanism only

**Logs:**
- `console.error` for server errors (in `src/server.ts`, `src/start.ts`, and error boundary components)
- No structured logging service (Datadog, Axiom, etc.)

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers (Nitro default target, configured via `@lovable.dev/vite-tanstack-config`)
- SSR handled by the edge worker; static assets served from Cloudflare CDN

**CI Pipeline:**
- None detected. No `.github/workflows/`, CircleCI, or similar config files present.

**Build commands:**
```bash
bun run build         # Production build
bun run build:dev     # Development build
bun run preview       # Preview built output
```

## Environment Configuration

**Required env vars (currently none enforced):**
- `NODE_ENV` — read by `src/lib/config.server.ts:getServerConfig()`
- Placeholder stubs in comments: `DATABASE_URL`, `STRIPE_SECRET_KEY`
- Public vars use `VITE_` prefix and are accessed via `import.meta.env.VITE_FOO`

**Secrets location:**
- No `.env` file present in repository
- On Cloudflare Workers, secrets are bound via Workers environment variables at deploy time, not `.env` files

## Webhooks & Callbacks

**Incoming:**
- None. No webhook endpoint handlers present.

**Outgoing:**
- None. No HTTP calls to external APIs in application code (all data is mocked).

## Server Functions

**Pattern:**
- TanStack Start `createServerFn` is the mechanism for server-side logic (replaces Supabase Edge Functions or Next.js API routes)
- Example: `src/lib/api/example.functions.ts` — POST handler with zod input validation
- Server functions run in the Nitro/Cloudflare Workers context; imports inside `.handler()` are tree-shaken from the client bundle

---

*Integration audit: 2026-06-02*
