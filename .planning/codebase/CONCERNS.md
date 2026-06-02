# Codebase Concerns

**Analysis Date:** 2026-06-02

## Tech Debt

**All data is hardcoded mock data — no real backend:**
- Issue: `mockDataService` wraps static arrays in `Promise.resolve()`. All queries return the same in-memory seed data on every render. No persistence, no mutations, no real async.
- Files: `src/data/mockDataService.ts`, `src/data/seed.ts`, `src/data/dataService.ts`
- Impact: No feature that writes data (create work order, update status, clock in/out) can work. Every query result is read-only and reset on page refresh.
- Fix approach: Implement a real backend `DataService` (e.g. Supabase, SQLite via Turso, or server-side API routes), call `setDataService(realImpl)` at boot. The `DataService` interface in `src/data/dataService.ts` is already in place.

**Technician and customer views use hardcoded seed IDs:**
- Issue: The tech dashboard hardcodes `"t_luis"` and the customer portal hardcodes `"c_maria"`. These will never resolve to the actual logged-in user.
- Files: `src/routes/_app.tech.index.tsx` (lines 12–13), `src/routes/_app.portal.index.tsx` (lines 12–14)
- Impact: Switching the role to "technician" or "customer" always shows Luis's/Maria's data, not the authenticated user's data. Multi-user deployment is blocked.
- Fix approach: Derive the active user ID from an auth context (or from `RoleContext` → profile lookup) and replace the hardcoded IDs.

**Manager view hardcodes user name in UI:**
- Issue: `"Sandra Pratt · Service manager"` is a static string in the JSX, not derived from a profile lookup.
- Files: `src/routes/_app.manager.index.tsx` (line 17)
- Impact: Will show the wrong name for any real manager user.
- Fix approach: Look up the active profile from `getProfileByRole("manager")` and render `profile.name`.

**Shop name is duplicated across multiple files:**
- Issue: `"Hialeah Auto Works"` appears as a literal string in `src/routes/_app.tsx` (line 20), `src/routes/_app.owner.index.tsx` (line 20), `src/routes/_app.portal.index.tsx` (line 18), and `src/data/seed.ts`. The `Shop` type and `getShop()` method exist but are not used in the app layout or page headers.
- Files: `src/routes/_app.tsx`, `src/routes/_app.owner.index.tsx`, `src/routes/_app.portal.index.tsx`
- Impact: Renaming the shop requires a multi-file find-and-replace; inconsistency if any instance is missed.
- Fix approach: Load shop name from `getDataService().getShop()` in the app layout and pass it down, or add a `useShop()` hook.

**Landing page hero work order ID is hardcoded:**
- Issue: `const heroId = "wo_001"` in `src/routes/index.tsx` (line 47). Links to this ID are used in two CTAs.
- Files: `src/routes/index.tsx`
- Impact: If the seed data changes or a real backend is connected, the hero link may 404 or show irrelevant data.
- Fix approach: Derive the hero work order from a query (e.g. first high-urgency in-progress order) rather than a hardcoded string.

**`noUnusedLocals` and `noUnusedParameters` are disabled in TypeScript:**
- Issue: `tsconfig.json` sets `"noUnusedLocals": false` and `"noUnusedParameters": false`.
- Files: `tsconfig.json`
- Impact: Dead variables and unused function parameters accumulate silently. As the codebase grows this increases noise and the risk of leaving stale logic in place.
- Fix approach: Enable both flags and resolve any resulting errors.

**AI service methods are defined but never called from the UI:**
- Issue: `DataService` exposes `getQuoteScore`, `getAiUrgencySuggestion`, and `getRecommendedProcedure`. None of the route components call these — they instead read `wo.quoteScore` and `wo.aiUrgency` directly from the work order object.
- Files: `src/data/dataService.ts` (lines 55–58), `src/data/mockDataService.ts` (lines 59–69)
- Impact: The service abstraction adds dead surface area. When a real AI backend is integrated, the code paths to invoke it do not exist in the UI layer yet.
- Fix approach: Either wire the AI methods into the work order detail route, or remove them from the interface until they are needed.

**10 of 11 work orders have empty `subsystems` arrays:**
- Issue: Only `wo_001` has populated subsystem data. All other work orders use `subsystems: []`.
- Files: `src/data/seed.ts` (lines 113–122)
- Impact: The subsystem section on the work order detail page (`src/routes/_app.work-orders.$id.tsx`) is blank for 10 of 11 tickets. The 3D viewer integration depends on subsystem data.
- Fix approach: Populate representative subsystem data for the remaining work orders, or add a UI state for "no subsystems recorded yet."

**`replace("_", " ")` for status display only replaces the first underscore:**
- Issue: `w.status.replace("_", " ")` is used inline in two places to convert underscore-separated status values to display strings. JavaScript `String.replace` with a string argument only replaces the first occurrence. `"awaiting_parts"` renders as `"awaiting parts"` (correct by coincidence), but any future status with two underscores (e.g. `"pending_customer_approval"`) would only partially convert.
- Files: `src/routes/_app.work-orders.index.tsx` (line 49), `src/routes/_app.work-orders.$id.tsx` (line 34)
- Impact: Display bug risk as status values expand.
- Fix approach: Use `replaceAll("_", " ")` or a shared `formatStatus(status: WorkOrderStatus): string` utility in `src/lib/utils.ts`.

**Customer nav items point to the same route:**
- Issue: In `src/app/roleNav.ts` (lines 46–50), "Service history", "Recommendations", and "My garage" all have `url: "/portal"`. Clicking them navigates to the same page.
- Files: `src/app/roleNav.ts`
- Impact: The sidebar nav is deceptive — three distinct items appear as separate destinations but all land on the same page. The navigation pattern will break if a user expects independent views.
- Fix approach: Implement dedicated routes `/portal/history`, `/portal/recommendations` (or similar) and update the nav items once those pages exist.

**Tech nav "Schedule" item also points to `/tech`:**
- Issue: In `src/app/roleNav.ts` (line 43), the "Schedule" nav item for the technician role uses `url: "/tech"` — the same URL as "My bay".
- Files: `src/app/roleNav.ts`
- Impact: Both nav items highlight simultaneously and navigate to the same page.
- Fix approach: Create a `/tech/schedule` route and update the nav item URL.

## Security Considerations

**No authentication or route authorization:**
- Risk: Any user can navigate to any role view directly via URL (e.g. `/owner`, `/manager`). The `RoleContext` stores the active role in `localStorage` — it is a UI convenience, not a security boundary. There are no route guards, session checks, or server-side auth.
- Files: `src/app/RoleContext.tsx`, `src/routes/_app.tsx`, all role-specific routes
- Current mitigation: None. The app is intentionally a demo.
- Recommendations: Before production, implement server-side session validation in `src/start.ts` middleware or TanStack Start server functions, add route-level auth guards, and stop reading role from `localStorage` as the source of truth.

**No `.gitignore` present:**
- Risk: Sensitive files (`.env`, credentials, build artifacts, `node_modules`) could be committed accidentally.
- Files: Repository root
- Current mitigation: None detected.
- Recommendations: Add a `.gitignore` covering at minimum: `node_modules/`, `.env`, `.env.*`, `.nitro/`, `dist/`, `.next/`.

**Error reporting via `window.__lovableEvents`:**
- Risk: The `reportLovableError` function dispatches errors (including stack traces) to a global `window.__lovableEvents` object injected by the Lovable platform. This is a platform-specific hook not under the project's control.
- Files: `src/lib/lovable-error-reporting.ts`, `src/routes/__root.tsx`
- Current mitigation: Guard on `typeof window === "undefined"` prevents SSR execution.
- Recommendations: Replace with a production error monitoring service (Sentry, Datadog) before going live.

## Performance Bottlenecks

**`getDataService()` called inside every component render:**
- Problem: Every route component calls `getDataService()` at the top of the component body on every render. This is a module-level singleton call, so it does not cause extra I/O, but it couples every component tightly to the global service singleton and will make testing difficult.
- Files: All route files under `src/routes/`
- Cause: No React context or DI mechanism wraps the data service.
- Improvement path: Provide the `DataService` instance via React context at the app root (similar to `QueryClientProvider`) so components do not import the service directly.

**TanStack Query `defaultPreloadStaleTime: 0`:**
- Problem: In `src/router.tsx` (line 11), `defaultPreloadStaleTime` is set to `0`, meaning every link hover triggers a fresh fetch. With mock data this is negligible, but with a real backend this could cause excessive requests on hover-heavy UIs like the work orders table.
- Files: `src/router.tsx`
- Cause: Default scaffold configuration.
- Improvement path: Set a reasonable stale time (e.g. `30_000` ms) once real data fetching is wired.

## Fragile Areas

**`error-capture.ts` global event listener pattern:**
- Files: `src/lib/error-capture.ts`
- Why fragile: Uses a module-level mutable variable (`lastCapturedError`) shared across the entire server process. In a Cloudflare Workers environment with concurrent requests, this is a race condition — error from request A could be consumed by the error handler for request B if they overlap within the 5-second TTL window.
- Safe modification: For production, replace with a per-request error propagation mechanism (e.g. an `AsyncLocalStorage` context or an explicit error passed through the call chain).
- Test coverage: None.

**`seed.ts` date anchoring uses `Date.UTC(2026, 5, 2, ...)`:**
- Files: `src/data/seed.ts` (line 55)
- Why fragile: All relative timestamps (ETA, created, updated) are offset from a hardcoded anchor date of June 2, 2026. As real calendar time advances past this date, "future" ETAs will appear as past dates and "recent" work orders will appear old. The demo will read as stale immediately after launch.
- Safe modification: Replace the anchor with `Date.now()` so timestamps stay relative to the current day, or use a fixed date only for snapshot tests.
- Test coverage: None.

**Role switcher is accessible to all users in the header:**
- Files: `src/components/role-switcher.tsx`, `src/routes/_app.tsx`
- Why fragile: The `RoleSwitcher` dropdown is rendered unconditionally for every authenticated session in the app header. In a production multi-tenant environment this means any user can switch into the owner or manager view.
- Safe modification: Gate `RoleSwitcher` rendering on a "dev/demo mode" flag or remove it entirely before production deployment.
- Test coverage: None.

## Missing Critical Features

**No data mutation support:**
- Problem: The `DataService` interface has no write methods (no `createWorkOrder`, `updateWorkOrderStatus`, `assignTechnician`, etc.). The entire interface is read-only.
- Blocks: All interactive workflows — creating tickets, updating status, clocking in/out, submitting quotes, approving invoices.

**No authentication system:**
- Problem: There is no login, session, or token mechanism anywhere in the codebase.
- Blocks: Multi-user operation, role-based access control, customer-specific data isolation.

**3D vehicle viewer is not implemented:**
- Problem: The landing page prominently features a 3D vehicle viewer as a core selling point. The actual viewer is a static SVG stub (`ViewerStub` in `src/routes/index.tsx` line 224). `src/data/subsystemMap.ts` maps subsystem keys to GLB mesh names but no 3D renderer or asset loader exists.
- Blocks: The "tickets pinned to subsystems" feature, interactive diagnosis flow. Referenced as "Phase 2" in `src/routes/_app.work-orders.$id.tsx` (line 72) and `src/data/subsystemMap.ts`.

**No search or filtering on any list view:**
- Problem: Work orders, customers, vehicles, inventory, and invoices are all rendered as flat tables with no search input, column filter, or pagination. The work orders list shows all 11 items with no way to filter by status, technician, or urgency.
- Blocks: Usability at any real shop scale (100+ work orders).

**No loading or error states in route components:**
- Problem: Every `useQuery` call in route components uses a default value fallback (e.g. `= []`) but never checks `isLoading`, `isPending`, or `isError`. Users see an empty table while data loads and see the same empty table if a query fails — no distinction between "loading" and "no data" or "error."
- Files: All route files under `src/routes/`
- Blocks: Production-quality UX; distinguishing real errors from empty state.

## Test Coverage Gaps

**No tests exist:**
- What's not tested: The entire codebase has zero test files. No unit tests, no integration tests, no end-to-end tests.
- Files: All files under `src/`
- Risk: Any refactor of `DataService`, `RoleContext`, subsystem logic, or routing can silently break behavior. The mock data calculations (open ticket counts, urgency filtering, revenue totals) are untested.
- Priority: High — especially once mutations are added.

---

*Concerns audit: 2026-06-02*
