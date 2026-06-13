# Plan 005: Unmount Collapsed Chart Rows to Stop Background Polling

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/src/components/layout/query-page/chart-row.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The dashboard page displays system query metrics using collapsible rows of charts. Currently, Radix UI's `<CollapsibleContent>` does not automatically unmount its children when collapsed. Because the child `<DynamicChart>` components remain in the React tree, their internal hooks (`useChartData`, which registers auto-refresh timers) continue to poll the database in the background. 

If a user keeps several chart rows collapsed, their browser silently runs dozens of background queries per minute on the ClickHouse database, putting unnecessary load on both client and server. Unmounting the charts when collapsed halts all active background polling.

## Current state

The file `apps/dashboard-tsr/src/components/layout/query-page/chart-row.tsx` implements the collapsible chart grid:

```typescript
// apps/dashboard-tsr/src/components/layout/query-page/chart-row.tsx:77-81
        {/* Expanded state - charts grid */}
        <CollapsibleContent>
          <div className="relative group pb-6 overflow-hidden">
            <div
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `cd apps/dashboard-tsr && bun run type-check` | exit 0, no errors |
| Test      | `cd apps/dashboard-tsr && bun test src/` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `apps/dashboard-tsr/src/components/layout/query-page/chart-row.tsx`

**Out of scope**:
- Modifications to `dynamic-chart.tsx` or base collapsible primitives.

## Git workflow

- Branch: `advisor/005-unmount-collapsed-chart-row`
- Commit message: `perf(dashboard-tsr): unmount collapsed chart rows to stop background polling`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Wrap CollapsibleContent children with conditional check

Open [chart-row.tsx](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/components/layout/query-page/chart-row.tsx). Wrap all children inside `<CollapsibleContent>` with `{!isCollapsed && ( ... )}`.

Target code structure:
```typescript
        {/* Expanded state - charts grid */}
        <CollapsibleContent>
          {!isCollapsed && (
            <div className="relative group pb-6 overflow-hidden">
              <div
                className={cn(
                  'grid gap-3 w-full min-w-0 overflow-hidden items-stretch',
                  // Single chart: full width (1-column grid)
                  chartCount === 1
                    ? 'grid-cols-1 auto-rows-[minmax(200px,auto)]'
                    : hasColSpan(charts)
                      ? 'grid-cols-1 md:grid-cols-10 auto-rows-[minmax(200px,auto)]'
                      : 'grid-cols-1 md:grid-cols-2 auto-rows-[minmax(200px,auto)]'
                )}
              >
                {charts.map((chartConfig, index) => {
                  // ... chart mapping ...
                })}
              </div>
              {/* Hide pill - bottom center, shows on hover */}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'absolute z-50 h-6 px-3 gap-1',
                    'bottom-2 left-1/2 -translate-x-1/2',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                    'bg-muted hover:bg-muted/80 text-muted-foreground',
                    'rounded-full text-xs'
                  )}
                  aria-label="Collapse row"
                >
                  <ChevronUpIcon className="size-3" />
                  <span>Hide</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          )}
        </CollapsibleContent>
```

**Verify**: `cd apps/dashboard-tsr && bun run type-check` returns exit 0.

### Step 2: Add test to verify unmount behavior (Optional/Verify component)

If there is a component test file for `chart-row` (e.g. `chart-row.cy.tsx`), ensure it verifies that when the row is collapsed, the charts are removed from the DOM. If not present, verification can be checked manually in local development using React DevTools to confirm that `DynamicChart` components unmount when collapsed.

Let's check if there is an existing cypress component test for `chart-row`. Let's search using grep.
`rg -n "ChartRow" --glob "*.cy.tsx"`
If none exists, manual runtime verification is sufficient.

## Test plan

- Run `cd apps/dashboard-tsr && bun run type-check` to confirm no type issues.
- Start the server (`bun run dev` inside `apps/dashboard-tsr`), open the queries page, collapse a chart row, and verify using the browser DevTools (Network tab) that background polling queries for charts in that row stop immediately.

## Done criteria

- [ ] `cd apps/dashboard-tsr && bun run type-check` exits 0.
- [ ] Collapse row unmounts `DynamicChart` children in the DOM.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If wrapping the content with `!isCollapsed` introduces React rendering errors or throws key conflicts during list mapping.

## Maintenance notes

- Because we use TanStack Query's cache with a 30-minute `gcTime`, reopening the chart row will instantly display the cached metrics before performing the background refresh query, keeping the user interface extremely fast.
