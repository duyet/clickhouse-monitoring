# Plan 009: Optimize Batched Menu Counts API to Avoid N+1 Queries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/src/routes/api/v1/menu-counts/index.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The sidebar menu displays badge counts (e.g. number of active merges, running queries, disks, replication queues) indicating system status. These are updated periodically. To fetch these counts, the frontend calls the batched `/api/v1/menu-counts` endpoint. 

Currently, the backend handler maps over all 16 count keys and runs `fetchData` in parallel inside a `Promise.all` loop. This executes 16 concurrent SELECT queries against ClickHouse for a single request, causing high connection parsing overhead, latency, and potential database connection exhaustion. By checking table existence first and then packing all active subqueries into a single SQL statement, we can fetch all counts in just one ClickHouse query round-trip.

## Current state

The file `apps/dashboard-tsr/src/routes/api/v1/menu-counts/index.ts` executes parallel query loops:

```typescript
// apps/dashboard-tsr/src/routes/api/v1/menu-counts/index.ts:129-143
    const keys = getAvailableMenuCountKeys()
    const resolved = await Promise.all(
      keys.map(async (key) => {
        const value = await resolveCount(key, hostId, requestId)
        return [key, value] as const
      })
    )

    const counts: Record<string, number | null> = {}
    for (const [key, value] of resolved) {
      if (value !== undefined) {
        counts[key] = value
      }
    }
```

And `resolveCount` runs a query per key:

```typescript
// apps/dashboard-tsr/src/routes/api/v1/menu-counts/index.ts:48-60
async function resolveCount(
  countKey: string,
  hostId: number,
  requestId: string
): Promise<number | null | undefined> {
  const menuCount = getMenuCountQuery(countKey)
  if (!menuCount) return undefined

  const result = await fetchData({
    query: menuCount.query,
    format: 'JSONEachRow',
    hostId,
  })
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
- `apps/dashboard-tsr/src/routes/api/v1/menu-counts/index.ts`
- `apps/dashboard-tsr/src/routes/api/v1/menu-counts/__tests__/index.test.ts` (create)

**Out of scope**:
- Modifications to `menu-count-registry.ts` or sidebar UI components.

## Git workflow

- Branch: `advisor/009-batched-menu-counts-query`
- Commit message: `perf(dashboard-tsr): optimize menu counts endpoint to use single batched query`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Optimize the menu-counts GET handler

Modify the GET route handler in [index.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/routes/api/v1/menu-counts/index.ts) to:

1. Query `system.tables` first to see which optional tables (such as `system.backup_log` or `system.distributed_ddl_queue`) exist.
2. Filter the active keys list based on which optional tables are available.
3. Dynamically construct a single SQL statement that combines all subqueries:
   `SELECT (SELECT count FROM (<query_1>)) AS \`key_1\`, (SELECT count FROM (<query_2>)) AS \`key_2\`, ...`
4. Run `fetchData` once with the combined query.
5. Parse the single resulting row and map it back into the expected JSON response (setting any skipped/unavailable optional table keys to `null`).

Target code replacement pattern:
```typescript
    // 1. Query system.tables to check which optional tables exist
    const tablesCheckResult = await fetchData({
      query: `SELECT database, name FROM system.tables WHERE (database = 'system' AND name IN ('distributed_ddl_queue', 'clusters', 'backup_log', 'dictionaries', 'view_refreshes')) OR (name = 'monitoring_events')`,
      format: 'JSONEachRow',
      hostId,
    })

    const existingTables = new Set<string>()
    if (!tablesCheckResult.error && Array.isArray(tablesCheckResult.data)) {
      for (const row of tablesCheckResult.data as Array<{ database: string; name: string }>) {
        existingTables.add(`${row.database}.${row.name}`)
        existingTables.add(row.name)
      }
    }

    // 2. Build combined subqueries
    const selectSubqueries: string[] = []
    const counts: Record<string, number | null> = {}

    for (const key of keys) {
      const menuCount = getMenuCountQuery(key)
      if (!menuCount) continue

      if (menuCount.optional && menuCount.tableCheck) {
        if (!existingTables.has(menuCount.tableCheck)) {
          // Table doesn't exist: return null without querying it
          counts[key] = null
          continue
        }
      }

      // Wrap the registry query as a subquery
      selectSubqueries.push(`(SELECT count FROM (${menuCount.query})) AS \`${key}\``)
    }

    if (selectSubqueries.length > 0) {
      const combinedQuery = `SELECT ${selectSubqueries.join(', ')}`
      const result = await fetchData({
        query: combinedQuery,
        format: 'JSONEachRow',
        hostId,
      })

      if (result.error) {
        // Fall back to original resolveCount loop if the combined query fails
        // (preserves robust error recovery on schema/version mismatches)
        debug('[GET /api/v1/menu-counts] Combined query failed. Falling back to loop.', {
          requestId,
          error: result.error.message
        })
        const resolved = await Promise.all(
          keys.map(async (k) => {
            const val = await resolveCount(k, hostId, requestId)
            return [k, val] as const
          })
        )
        for (const [k, val] of resolved) {
          if (val !== undefined) counts[k] = val
        }
      } else {
        const data = result.data as Record<string, number | string>[]
        if (data && data.length > 0) {
          const row = data[0]
          for (const key of Object.keys(row)) {
            counts[key] = Number(row[key])
          }
        }
      }
    }
```

**Verify**: `cd apps/dashboard-tsr && bun run type-check` returns exit 0.

### Step 2: Create integration/unit tests for menu-counts endpoint

Create a new test file `apps/dashboard-tsr/src/routes/api/v1/menu-counts/__tests__/index.test.ts` to assert that:
1. The combined query is constructed correctly.
2. Missing optional tables are handled gracefully (return `null` values).
3. The response JSON structure matches `{ counts: { ... } }`.

## Test plan

- Run `cd apps/dashboard-tsr && bun test src/routes/api/v1/menu-counts/` to execute the endpoint tests.

## Done criteria

- [ ] `cd apps/dashboard-tsr && bun run type-check` exits 0.
- [ ] Batched counts endpoint tests pass successfully.
- [ ] Endpoint performs exactly one query against ClickHouse under ordinary conditions (tables exists check is also 1 query).
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If wrapping a registry query in `SELECT count FROM (<query>)` causes ClickHouse syntax errors on joins/subqueries.
- If fallback logic is not triggered when the combined query fails (e.g. due to syntax mismatch on old Clickhouse versions).

## Maintenance notes

- None.
