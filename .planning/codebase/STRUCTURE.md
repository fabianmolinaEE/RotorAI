# Directory Structure
<!-- last_mapped_commit: 7bcb983 | mapped: 2026-06-02 -->

## Top-Level Layout

```
RotorAI/
├── src/                    # All application source
│   ├── app/                # Global React context and app config
│   ├── components/         # Shared UI components
│   │   └── ui/             # shadcn/Radix primitives (auto-generated, do not hand-edit)
│   ├── data/               # Data layer: types, service interface, mock impl, seed
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities, server helpers, error handling
│   ├── routes/             # TanStack Router file-based routes
│   └── styles.css          # Global CSS / Tailwind entry
├── .planning/              # GSD planning artifacts (not shipped)
│   ├── codebase/           # This codebase map
│   └── HANDOFF.json        # Session state
├── package.json
├── vite.config.ts
├── tsconfig.json
├── components.json         # shadcn/ui config
├── bunfig.toml
└── eslint.config.js
```

## Key Directories

### `src/app/`
Global React context and configuration.

| File | Purpose |
|------|---------|
| `RoleContext.tsx` | Active role state (localStorage-backed), `useRole()` hook |
| `ThemeProvider.tsx` | Light/dark theme state (localStorage-backed) |
| `roleNav.ts` | Per-role navigation config (which nav items each role sees) |

### `src/data/`
The most important directory — the clean data boundary between demo and real.

| File | Purpose |
|------|---------|
| `types.ts` | All TypeScript domain interfaces (Shop, Vehicle, WorkOrder, Technician, Customer, Invoice, etc.) |
| `dataService.ts` | `DataService` interface — the only contract components program against |
| `mockDataService.ts` | Mock implementation of DataService — returns seeded demo data |
| `seed.ts` | All mock data fixtures (Hialeah Auto Works, Maria Reyes, Luis Ortega, etc.) |
| `subsystemMap.ts` | subsystem_key → mesh name mapping for Phase 2 3D viewer |

### `src/routes/`
TanStack Router file-based routes. Files map directly to URL structure.

| File | URL | Notes |
|------|-----|-------|
| `__root.tsx` | — | Document root, providers, error boundaries |
| `index.tsx` | `/` | Public marketing landing page |
| `_app.tsx` | — | Authenticated app shell layout (sidebar + header) |
| `_app.owner.index.tsx` | `/owner` | Owner dashboard |
| `_app.manager.index.tsx` | `/manager` | Manager dashboard |
| `_app.tech.index.tsx` | `/tech` | Technician dashboard |
| `_app.portal.index.tsx` | `/portal` | Customer portal |
| `_app.work-orders.index.tsx` | `/work-orders` | Work order list |
| `_app.work-orders.$id.tsx` | `/work-orders/:id` | Work order detail |
| `_app.vehicles.index.tsx` | `/vehicles` | Vehicles |
| `_app.customers.index.tsx` | `/customers` | Customers |
| `_app.inventory.index.tsx` | `/inventory` | Inventory |
| `_app.invoices.index.tsx` | `/invoices` | Invoices |
| `routeTree.gen.ts` | — | **Auto-generated** — do not edit |

### `src/components/`
App-specific shared components.

| File | Purpose |
|------|---------|
| `page-shell.tsx` | Layout wrapper used by all app pages |
| `app-sidebar.tsx` | Role-gated side navigation |
| `role-switcher.tsx` | Demo role dropdown (replaces auth for demo) |
| `theme-toggle.tsx` | Light/dark mode toggle |
| `ui/` | 40+ shadcn/Radix primitives (Button, Dialog, Select, etc.) |

### `src/lib/`
Utilities and server-side helpers.

| File | Purpose |
|------|---------|
| `utils.ts` | `cn()` Tailwind class merge utility |
| `api/` | `createServerFn` pattern with Zod validation |
| `config.server.ts` | Server-only config (env vars) |
| `error-page.ts` | Error page helpers |
| `error-capture.ts` | Client-side error capture |
| `lovable-error-reporting.ts` | Lovable dev-time error reporting |

### `src/hooks/`
| File | Purpose |
|------|---------|
| `use-mobile.tsx` | Responsive breakpoint hook |

## Naming Conventions

- **Routes:** `_app.[section].index.tsx` for index pages; `_app.[section].$param.tsx` for detail pages
- **Components:** PascalCase files, kebab-case filenames (`page-shell.tsx` → `PageShell`)
- **Data:** camelCase throughout (`mockDataService`, `workOrderId`)
- **Types:** PascalCase interfaces (`WorkOrder`, `Technician`)
- **Hooks:** `use-` prefix, camelCase (`use-mobile.tsx`)
- **Shadcn:** Generated into `src/components/ui/` — follow existing patterns when adding new primitives
