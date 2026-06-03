---
phase: 02-3d-vehicle-viewer
plan: "01"
subsystem: vehicle-viewer
tags: [3d, react-three-fiber, drei, webgl, ssr-guard, demo]
dependency_graph:
  requires: []
  provides: [VehicleViewer, three-stack]
  affects: [src/routes/_app.work-orders.$id.tsx, Phase 3 card grids]
tech_stack:
  added:
    - three@0.184.0
    - "@react-three/fiber@9.6.1"
    - "@react-three/drei@10.7.7"
    - "@types/three@0.184.1 (dev)"
  patterns:
    - SSR mount guard (useState + useEffect)
    - R3F frameloop=demand with FreezeMiniCanvas helper
    - "@react-three/drei Html for tooltip"
    - "@react-three/drei OrbitControls"
key_files:
  created:
    - src/components/vehicle-viewer.tsx
  modified:
    - package.json
    - bun.lock
decisions:
  - "DoubleSide imported as named export from three (not THREE.DoubleSide) for Vite tree-shaking safety"
  - "body subsystem key maps to glass shell only — no duplicate solid mesh rendered for body"
  - "Tooltip rendered on i===0 position only for paired subsystems (brakes, suspension) to avoid double tooltip"
  - "FreezeMiniCanvas uses invalidate() pattern over gl.setAnimationLoop(null) per RESEARCH.md recommendation"
metrics:
  duration_seconds: 168
  tasks_completed: 2
  tasks_total: 3
  completed_date: "2026-06-03"
  stopped_at: "checkpoint:human-verify (Task 3)"
---

# Phase 02 Plan 01: Three.js Stack + VehicleViewer Summary

**One-liner:** Three.js stack installed and VehicleViewer built with glass-body diagnostic scan aesthetic, status-colored subsystem primitives, hover tooltips, orbit controls (full), and frozen static thumbnail (mini).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install the Three.js stack | 07ce531 | package.json, bun.lock |
| 2 | Build the VehicleViewer component | e0dfb36 | src/components/vehicle-viewer.tsx |

## Task 3 — Checkpoint

Task 3 is `checkpoint:human-verify`. Execution paused here pending user verification.

## Installed Versions

| Package | Requested | Installed |
|---------|-----------|-----------|
| `three` | 0.184.0 | 0.184.0 |
| `@react-three/fiber` | 9.6.1 | 9.6.1 |
| `@react-three/drei` | 10.7.7 | 10.7.7 |
| `@types/three` | 0.184.1 (dev) | 0.184.1 |

All at exact pinned versions from RESEARCH.md. React 19.x unchanged.

## VehicleViewer Props Contract (for Plan 2 consumption)

```typescript
interface VehicleViewerProps {
  subsystems: Subsystem[];           // full list — drives all highlighting
  mode: "full" | "mini";
  onSubsystemClick?: (key: SubsystemKey) => void;  // ignored in mini mode
  className?: string;
}

// Import path:
import { VehicleViewer } from "@/components/vehicle-viewer";
```

## Subsystem Primitive Layout

The 10 mechanical subsystems (body key maps to glass shell only) are rendered at these positions:

| Key | Geometry | Positions |
|-----|----------|-----------|
| engine | box [1.0, 0.5, 0.9] | [-1.2, 0, 0] |
| transmission | box [0.6, 0.35, 0.5] | [-0.3, -0.2, 0] |
| brakes_front | cylinder r=0.28 h=0.12 | [-1.4, -0.45, ±0.72] |
| brakes_rear | cylinder r=0.25 h=0.12 | [1.3, -0.45, ±0.72] |
| suspension_front | box [0.15, 0.5, 0.1] | [-1.4, -0.2, ±0.75] |
| suspension_rear | box [0.15, 0.5, 0.1] | [1.3, -0.2, ±0.75] |
| steering | box [0.1, 0.1, 1.0] | [-1.0, 0.1, 0] |
| electrical | box [0.4, 0.3, 0.35] | [-1.5, 0.3, -0.4] |
| exhaust | box [2.2, 0.08, 0.08] | [0.5, -0.55, 0.5] |
| hvac | box [0.45, 0.3, 0.5] | [-0.8, 0.4, 0] |

Glass shell: box [4.2, 1.4, 1.8] at [0,0,0], opacity=0.20, depthWrite=false, DoubleSide.

These positions match the UI-SPEC §6.1 starting coordinates. Minor adjustments are possible in Plan 2 if visual review indicates improvements needed.

## SSR Mount Guard

The `useState(false)` + `useEffect(() => setMounted(true))` pattern was sufficient. No `React.lazy` fallback was needed. TypeScript compilation (`npx tsc --noEmit`) passed with zero errors.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- Bun was not installed in the execution environment. It was installed via the official installer (`curl -fsSL https://bun.sh/install | bash`) before running `bun add`. This is a Rule 3 (blocking issue) auto-fix. The project CLAUDE.md requires Bun; installing Bun is the correct resolution, not falling back to npm.
- Tooltip is rendered only on the first position mesh (`i === 0`) for subsystems with paired meshes (brakes, suspension). This prevents double tooltips appearing when hovering paired primitives.

## Known Stubs

None — VehicleViewer accepts subsystems as props and renders real data. No hardcoded placeholders.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All data is prop-driven from pre-seeded mock data. T-02-01 (supply chain) mitigated: installed exact pinned versions from RESEARCH.md. T-02-03 (mini mode GPU cost) mitigated: frameloop=demand + FreezeMiniCanvas.

## Self-Check: PASSED

- FOUND: src/components/vehicle-viewer.tsx
- FOUND: package.json (with three, @react-three/fiber, @react-three/drei, @types/three)
- FOUND: commit 07ce531 (Task 1 — install three.js stack)
- FOUND: commit e0dfb36 (Task 2 — build VehicleViewer component)
- TypeScript compilation: zero errors (npx tsc --noEmit)
