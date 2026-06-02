# RotorAI

## What This Is

RotorAI is shop management software built specifically for car mechanic shops and dealership service departments — opinionated for mechanics, not a generic business tool. It exposes four distinct role views (owner, manager, technician, customer), a 3D interactive vehicle subsystem viewer as the hero feature, and AI-assisted workflows for urgency triage, quote evaluation, repair guidance, and customer communication. The first milestone is a fully clickable pitch demo; the real product runs on Supabase with the same frontend, swapped at the data layer.

## Core Value

A mechanic can open any ticket, see exactly which subsystems need work in 3D, and know what to do next — no guessing, no paper, no context switching.

## Requirements

### Validated

- ✓ Data layer with typed `DataService` interface, `mockDataService` impl, and seed fixtures — existing
- ✓ Role union type (`owner | manager | technician | customer`) driving nav and landing route — existing
- ✓ Role switcher in header (no login) — existing
- ✓ App shell with role-gated sidebar and layout — existing
- ✓ Public marketing landing page at `/` — existing
- ✓ Basic route structure for all four role views — existing
- ✓ TanStack Start + TanStack Router + Vite + Tailwind v4 + shadcn/ui + Bun stack — existing

### Active

- [ ] 3D VehicleViewer component (React Three Fiber, primitives → GLB-ready, ok/check/fix subsystem highlighting, clickable, mini + full modes)
- [ ] SubsystemDetailPanel (tools, time estimate, step procedure, reference links per subsystem)
- [ ] Technician role view: ticket card grid with mini viewers, full ticket detail page, tool checkout, timekeeping
- [ ] Customer role view (Maria Reyes): vehicle grid, active/past work tabs, quote with reasonableness score, which shop is doing the work
- [ ] Manager role view (Sandra Pratt): team roster, work order queue table, filterable by tech and urgency
- [ ] Owner role view: analytics-first (revenue/cost/profit charts), urgency table, full nav rail with subpages
- [ ] Hero demo flow: landing → app → Technician → high-urgency Civic ticket → click red subsystem → Customer (Maria) → Owner analytics
- [ ] Both light and dark mode: every screen full and believable, no empty states on demo path
- [ ] Real-app graduation guide: README documenting data layer + swap instructions for Supabase auth and real services

### Out of Scope (Demo Milestone)

- Real Supabase auth — role switcher replaces login for pitch
- Real database or API calls — everything runs on mock seed data
- Real AI/LLM calls — urgency and quote score are pre-filled static values
- Real car CAD models — primitives or free CC0 GLB only
- Mobile app — web-first
- Video posts / real-time chat — not core to shop management value

## Context

- Project initiated in Lovable (Lovable-flavored TanStack Start boilerplate), repo transferred to Claude Code for Phases 2–4 and eventual real backend
- Demo story is fixed and seeded: "Hialeah Auto Works", customer Maria Reyes (2019 Honda Civic + 2015 Ford F-150), high-urgency Civic ticket (brakes_front=fix, electrical=check), technician Luis Ortega, manager Sandra Pratt
- Target market: independent mechanic shops first; dealership service depts later
- Pitch deadline: within weeks — demo polish is time-sensitive
- Post-demo path: swap `mockDataService` → `supabaseDataService` (same interface), add Supabase auth in place of role switcher, wire `getQuoteScore` / `getAiUrgencySuggestion` to real LLM calls
- AI features planned post-demo: quote reasonableness scoring, urgency detection from symptoms/history, repair procedure guidance, AI-drafted customer communications — all require real shop data to validate

## Constraints

- **Tech stack**: React 19 + TypeScript + TanStack Start/Router + Vite + Tailwind v4 + shadcn/ui + Bun + Cloudflare Workers — locked, matches Lovable scaffold
- **3D library**: @react-three/fiber + @react-three/drei — locked per demo spec
- **Charts**: recharts — locked per demo spec
- **Architecture**: All components read through `DataService` interface only — enforced constraint enabling demo→real swap
- **Demo scope**: No real backend, no auth, no LLM calls during demo milestone
- **Timeline**: Demo must be pitch-ready within weeks

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Swappable DataService layer | Lets the demo and real product share the same frontend; swap one file, not a rewrite | — Pending |
| Role switcher instead of auth | Removes login risk during live pitch; stakeholders can instantly see all role views | ✓ Good |
| Primitives for 3D car (for now) | No asset dependency blocks; real GLB can be dropped in by changing subsystemMap.ts | — Pending |
| SaaS per shop pricing | Independent shops are the entry market; per-shop flat rate is the simplest pitch | — Pending |
| TanStack Start over Next.js | Lovable's opinionated stack; SSR + Cloudflare Workers targeting out of the box | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-02 after initialization*
