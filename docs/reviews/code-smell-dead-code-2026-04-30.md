# Code Smell and Dead Code Review - 2026-04-30

Scope: recent changes since the last handled repo scan, focused on
`ca2328c3` and `e8675d72`.

## Findings

### Warning: duplicated history query filter predicates

- File: `lib/query-config/queries/history-queries.ts:40` and
  `lib/query-config/queries/history-queries.ts:86`
- Severity: warning
- Evidence:
  - Both versioned SQL variants repeated the same `WHERE`, `ORDER BY`, and
    `LIMIT` block.
  - Recent fixes changed optional URL filters in both blocks:
    `min_duration_s`, `last_hours`, `min_memory_mb`, and `min_read_rows`.
- Fix:
  - Extracted the shared predicate block to `historyQueryFilters` so later
    filter changes have one source.
- Behavior:
  - No intended SQL behavior change. The selected columns stay versioned, and
    only the shared filter block moved.

## Dead Code Check

No confident dead-code removals were found.

- `rg -n "historyQueriesConfig" --glob '!**/*.test.*' --glob '!**/*.cy.*'`
  shows live references from the registry and history queries page.
- `rg -n "QueryFiltersBar" --glob '!**/*.test.*' --glob '!**/*.cy.*'`
  shows the filter bar is used by `app/history-queries/page.tsx`.
- `rg -n "duration_1m" --glob '!**/*.test.*' --glob '!**/*.cy.*'`
  shows the legacy parameter is still present in SQL/default params. Removing
  it could change URL compatibility, so it was not treated as dead code.

## ClickHouse Rules Checked

- `query-index-skipping-indices`: no action. The reviewed query targets
  `system.query_log`; adding table indices is outside this app config and would
  change database setup, not just maintainability.
