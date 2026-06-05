# RotorAI

RotorAI is shop management software for mechanic shops and dealership service departments; this demo runs entirely on frontend mock data, and the real product swaps in at the data layer.

## Stack

React 19 + TypeScript + TanStack Start/Router + Vite + Tailwind v4 + shadcn/ui + Bun + Cloudflare Workers; 3D via `@react-three/fiber` + `@react-three/drei`; charts via `recharts`.

## Run It

```bash
bun install
bun run dev
```

## Data Layer

`src/data/types.ts` defines the core entities: `Vehicle`, `WorkOrder`, `Subsystem`, `Customer`, `Invoice`, and the rest of the shop model.

`src/data/dataService.ts` defines the `DataService` interface: async read methods for every entity plus three demo AI methods, `getQuoteScore`, `getAiUrgencySuggestion`, and `getRecommendedProcedure`. UI code should read through `getDataService()` instead of importing a concrete backend.

`src/data/mockDataService.ts` is the current `mockDataService` implementation, backed by seed fixtures. The single swap hook is `setDataService(impl: DataService)` in `src/data/dataService.ts`.

## Going Real — 3 Steps

1. **Swap the data service.** Implement `supabaseDataService` against the same `DataService` interface, then register it at app start, such as in `src/router.tsx` or another entry module.

```ts
import { setDataService } from "@/data/dataService";
import { supabaseDataService } from "@/data/supabaseDataService";

setDataService(supabaseDataService); // replaces mockDataService
```

2. **Replace the role switcher with Supabase auth.** Today `RoleContext` (`src/app/RoleContext.tsx`) stores the active role in local state and localStorage under `"haw.role"`. Derive the role from the authenticated session instead.

```ts
// src/app/RoleContext.tsx — derive role from the Supabase session
const { data: { user } } = await supabase.auth.getUser();
const role = (user?.user_metadata.role ?? "customer") as Role;
```

3. **Wire the AI methods to a real LLM.** The AI methods on `mockDataService` return static demo values. Point them at an edge function or LLM API in `supabaseDataService`.

```ts
async getQuoteScore(workOrderId: string): Promise<number> {
  const res = await fetch("/api/ai/quote-score", {
    method: "POST",
    body: JSON.stringify({ workOrderId }),
  });
  return (await res.json()).score;
}

// Same pattern for getAiUrgencySuggestion(workOrderId).
```

## Constraints

- Demo milestone has no real backend, no auth, and no LLM calls.
- All components must read through `DataService`.
- Keep the backend swap a data-layer change, not a frontend rewrite.
