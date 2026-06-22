# Plan 026: The Overview page stops re-rendering all charts when a single KPI poll updates

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row for this
> plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat ab64addc0..HEAD -- "apps/dashboard/src/routes/(dashboard)/overview.tsx"`
> If the file changed since this plan was written, compare the "Current state"
> excerpts to live code before proceeding; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `ab64addc0`, 2026-06-22

## Why this matters

The Overview page renders 14–17 charts per tab. Each KPI card and chart polls on its own interval (15s/2m/5m). When any one of them updates, the page container re-renders, and because `OverviewChart` is a plain function (not memoized) and `LazyTabContent` rebuilds its `banners`/`gridCharts` arrays with `.filter()` on every render, every chart wrapper re-renders and the freshly-filtered arrays break referential identity for anything downstream. Memoizing the wrapper and the two filtered arrays confines re-renders to the charts whose data actually changed. This is behavior-preserving — pure render-output is identical; only redundant work is removed.

## Current state

- `apps/dashboard/src/routes/(dashboard)/overview.tsx` — the Overview route.
  - `OverviewChart` (lines 61–92) is a plain function component. It renders `chartConfig.component` with props including two `cn(...)` calls (lines 77–86) and `{...(chartConfig.props ?? {})}` (line 89). All inputs (`chartConfig`, `hostId`, `banner`) are stable per chart.
  - `LazyTabContent` (from line 94) computes on every render (lines 110–111):
    ```ts
    const banners = charts.filter((chart) => chart.fullWidth)
    const gridCharts = charts.filter((chart) => !chart.fullWidth)
    ```
    `charts` is a stable prop (a module-level config array per tab).
- Convention: `memo` and `useMemo` are already used across this codebase for exactly this (see the recent `running-queries-charts.tsx` and `keeper-node-cards.tsx`). `cn` is imported from `@/lib/utils`. Match existing import style (`import { memo, useMemo } from 'react'`).
- NOTE: `running-queries-charts.tsx` and `keeper-node-cards.tsx` were already memoized in a prior PR — do not touch them; this plan is only `overview.tsx`.

## Commands you will need

| Purpose | Command | Expected |
|---------|---------|----------|
| Build+typecheck | `cd apps/dashboard && bun run build` | exit 0 |
| Test-only typecheck | `cd apps/dashboard && bun run type-check:test` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Component tests (if any touch overview) | `cd apps/dashboard && bun test src/routes` | all pass |

## Scope

**In scope** (only file you may modify):
- `apps/dashboard/src/routes/(dashboard)/overview.tsx`

**Out of scope** (do NOT touch):
- Any chart component under `components/charts/**` — memoizing individual charts is a separate concern; this plan is structural memoization in the page only.
- `running-queries-charts.tsx`, `keeper-node-cards.tsx` — already memoized.
- Any change to chart props, intervals, or query keys — purely wrap existing values.

## Git workflow

- Branch: `perf/overview-render-memoization`
- Commit: `perf(overview): memoize OverviewChart wrapper and tab chart filters` + `Co-Authored-By: duyetbot <bot@duyet.net>`.
- Commits MUST be signed (`git commit -S`); `main` enforces `required_signatures`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Memoize `OverviewChart`

Wrap the `OverviewChart` function component in `memo(...)`. Its props (`chartConfig`, `hostId`, `banner`) are referentially stable, so the default shallow comparison is correct. Keep the body identical. If `OverviewChart` is referenced before definition, convert to `const OverviewChart = memo(function OverviewChart({...}) { ... })`.

Inside it, the two `cn(...)` results depend only on `banner` and `chartConfig` — leave them inline (memo already prevents re-render when props are unchanged; wrapping `cn` in `useMemo` inside a memoized component is redundant). Do NOT change `{...(chartConfig.props ?? {})}` — `chartConfig` is stable so the spread is computed once per actual prop change.

**Verify**: `cd apps/dashboard && bun run build` → exit 0.

### Step 2: Memoize the two filtered arrays in `LazyTabContent`

Replace the two render-time `.filter()` calls with `useMemo` keyed on `charts`:
```ts
const banners = useMemo(() => charts.filter((chart) => chart.fullWidth), [charts])
const gridCharts = useMemo(() => charts.filter((chart) => !chart.fullWidth), [charts])
```
Add `useMemo` to the React import.

**Verify**: `cd apps/dashboard && bun run build` → exit 0. Then `bun run lint` → exit 0 (Biome must not flag the deps array; `charts` is the only dependency).

### Step 3: Confirm no behavior change

The rendered tree must be identical — same charts, same order, same props. Only re-render frequency changes.

**Verify**: `cd apps/dashboard && bun run type-check:test` → exit 0. If overview component tests exist (`rg -l overview apps/dashboard/src/**/__tests__ apps/dashboard/cypress 2>/dev/null`), run them; all pass.

## Test plan

- No new unit tests required (pure structural memoization; output unchanged). If a render-count regression test is cheap with the repo's existing React Testing Library setup, add one asserting that re-rendering the parent with unchanged `charts` does not re-invoke a chart spy — but only if a comparable test pattern already exists in the repo. Otherwise rely on build/typecheck/lint gates.
- Verification: build + type-check:test + lint all green.

## Done criteria

- [ ] `cd apps/dashboard && bun run build` exits 0
- [ ] `cd apps/dashboard && bun run type-check:test` exits 0
- [ ] `bun run lint` exits 0
- [ ] `OverviewChart` is wrapped in `memo`; the two `LazyTabContent` filters use `useMemo([charts])`
- [ ] `git status` shows only `overview.tsx` changed
- [ ] `plans/README.md` Run-2 status row for 026 updated

## STOP conditions

- The `OverviewChart` / `LazyTabContent` excerpts no longer match the live file (it was refactored since planning).
- Wrapping in `memo` introduces a TypeScript error that can't be resolved by the `const X = memo(function X(){})` form — report it.
- Lint flags an exhaustive-deps issue that implies `charts` is not actually stable (e.g. it's derived inline in the parent) — STOP and report; the parent may need the fix instead.

## Maintenance notes

- If `OverviewChart` later gains a prop that is an inline object/array/callback created in the parent, the `memo` will stop helping — memoize that prop at the call site too.
- Reviewer should confirm `charts` is a stable reference (module-level tab config), otherwise `useMemo([charts])` recomputes every render and the change is a no-op.
- This is the page-level half of the perf work; per-chart `memo` on the ~6 remaining un-memoized chart components in `components/charts/query/*` is a reasonable follow-up but deliberately out of scope here.
