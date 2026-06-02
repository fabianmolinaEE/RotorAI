# Testing
<!-- last_mapped_commit: 7bcb983 | mapped: 2026-06-02 -->

## Current State

**No tests exist in this codebase.** This is a Lovable-generated demo project in Phase 1 of construction. No test files (`*.test.*`, `*.spec.*`), no test runner config (`vitest.config.*`, `jest.config.*`), and no test-related scripts in `package.json`.

## Testing Infrastructure (Not Yet Set Up)

The codebase does not yet have:
- Test runner (Vitest recommended for Vite/TanStack projects)
- Component testing (Vitest + React Testing Library)
- E2E testing (Playwright or Cypress)
- CI test step

## Recommended Test Strategy (When Tests Are Added)

### Test Runner
**Vitest** — native Vite integration, same config file, fast HMR-aware reruns.

```bash
bun add -D vitest @vitest/ui @testing-library/react @testing-library/user-event jsdom
```

### What to Test

**High priority — data layer:**
- `mockDataService.ts` — all `DataService` methods return correct types and realistic data
- `seed.ts` — seed data satisfies all type interfaces
- `getQuoteScore` / `getAiUrgencySuggestion` return valid values

**Medium priority — business logic:**
- Role nav config (`roleNav.ts`) — each role returns correct nav items
- `RoleContext` — role switching persists and routes correctly
- `roleLandingRoute` — each role maps to correct path

**Lower priority — UI components:**
- `PageShell` renders title/description/actions slots correctly
- `RoleSwitcher` — switching fires setRole correctly

### Mocking Pattern (Future)

Since components go through `getDataService()`, tests swap the implementation:

```ts
import { setDataService } from "@/data/dataService";

const mockSvc: DataService = { ... };
beforeEach(() => setDataService(mockSvc));
```

This is the intended seam — no complex module mocking needed.

## Notes

- The `DataService` / `mockDataService` architecture makes unit testing straightforward when added
- `setDataService()` in `src/data/dataService.ts` exists exactly for this purpose
- When Supabase is wired up, integration tests should verify `supabaseDataService` implements the same interface contract as `mockDataService`
