# Conventions
<!-- last_mapped_commit: 7bcb983 | mapped: 2026-06-02 -->

## Language & Tooling

- **TypeScript** strict mode throughout — no `any` in production paths
- **Bun** as runtime / package manager (`bunfig.toml`)
- **ESLint** + **Prettier** via `eslint-plugin-prettier/recommended`
- **TypeScript ESLint** recommended rules; `@typescript-eslint/no-unused-vars` turned off
- `react-hooks/recommended` enforced; `react-refresh/only-export-components` warned

## File & Directory Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Component files | kebab-case | `page-shell.tsx`, `role-switcher.tsx` |
| Hook files | `use-` prefix, kebab-case | `use-mobile.tsx` |
| Route files | TanStack Router convention | `_app.work-orders.$id.tsx` |
| Server-only files | `.server.ts` suffix | `config.server.ts` |
| Context files | PascalCase | `RoleContext.tsx`, `ThemeProvider.tsx` |
| Data layer | camelCase | `mockDataService.ts`, `dataService.ts` |
| Type files | camelCase | `types.ts`, `subsystemMap.ts` |

## Component Patterns

**Function components only** — no class components.

```tsx
// Named export, function declaration
export function PageShell({ title, description, children }: { ... }) {
  return (...)
}

// Multiple small exports from one file are fine when tightly related
export function Stat({ label, value, sub }: { ... }) { ... }
```

**Props typed inline** as object literals in the function signature — no separate `Props` type unless complex.

**React.FC / React.ReactNode** — `ReactNode` imported directly from `"react"`, not `React.ReactNode`.

## Styling

- **Tailwind CSS** — utility classes directly on elements
- **shadcn/ui** design tokens via CSS variables (`bg-card`, `text-muted-foreground`, `border`, etc.)
- **`cn()` utility** from `src/lib/utils.ts` for conditional class merging (wraps `clsx` + `tailwind-merge`)
- Layout pattern: `mx-auto w-full max-w-7xl px-6 py-8` for page-level containers
- Typography: `text-2xl font-semibold tracking-tight` for h1; `text-sm text-muted-foreground` for descriptions
- Cards: `rounded-md border bg-card p-4`
- Spacing: generous whitespace, gap-3 / gap-4 grid gutters

## Data Access Pattern

**Always go through `getDataService()`** — never import from `seed.ts` or `mockDataService.ts` directly in components.

```tsx
// Correct
const svc = getDataService();
const { data } = useQuery({ queryKey: ['tech', id], queryFn: () => svc.getTechnicianById(id) });

// Wrong — never do this
import { seed } from "@/data/seed";
```

**TanStack Query** for all async data fetching. Query keys follow `[entity, id?]` pattern:
```tsx
queryKey: ["wos", "t_luis"]
queryKey: ["tech", "t_luis"]
```

## Routing Pattern

```tsx
// Every route file exports `Route` via createFileRoute
export const Route = createFileRoute("/_app/tech/")({
  component: TechHome,
});

// Component is a named function inside the same file
function TechHome() { ... }
```

- `routeTree.gen.ts` is **auto-generated** — never edit manually; run `vite dev` to regenerate.

## Context Pattern

```tsx
// Typed context with null default + guard hook
const Ctx = createContext<MyCtx | null>(null);

export function useMyCtx(): MyCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMyCtx must be used inside MyProvider");
  return v;
}
```

- localStorage persistence uses `try/catch` to handle SSR/private-browsing edge cases
- Validation of stored values is explicit (no blind cast from localStorage)

## Imports

- **`@/`** alias maps to `src/` — always use alias, never relative `../../`
- Type-only imports use `import type { ... }` syntax
- Server-only modules: `.server.ts` suffix; importing `server-only` npm package is blocked by ESLint rule

## Error Handling

- Route-level error boundaries in `__root.tsx`
- `lovable-error-reporting.ts` in lib — dev-time error capture for Lovable integration
- Server errors normalized in `src/server.ts`
- Async errors in TanStack Query propagate to nearest error boundary

## Key Rules

1. Components only call `getDataService()` — never touch raw data arrays
2. Route files export exactly one `Route` constant and one named component
3. `routeTree.gen.ts` is never hand-edited
4. `src/components/ui/` files are shadcn-generated — add via `npx shadcn add`, don't hand-edit
5. Server-only code goes in `.server.ts` files
