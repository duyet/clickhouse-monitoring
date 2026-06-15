# Plan 020: Conditional JSON Serialization of Query Response in Debug Log

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 29d5f8ec..HEAD -- packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: performance
- **Planned at**: commit `29d5f8ec`, 2026-06-14
- **State**: TODO

## Why this matters

In `clickhouse-fetch.ts`, the query response `data` is serialized to a JSON string unconditionally using `JSON.stringify(data)` in order to show a preview in the debug logs. This happens regardless of whether the debug log level/logging environment is active.

For large datasets, calling `JSON.stringify` on every fetch wastes CPU cycles, allocates large strings, and risks out-of-memory (OOM) crashes in production even when debug logs are turned off. Wrapping this in a check for logger status or serializing lazily solves the performance hazard.

## Current state

In `packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts`:
```typescript
    // Use the client's json() method which handles format-specific parsing
    const data = (await resultSet.json()) as T

    // For debugging: serialize the parsed data to see what we got
    const rawText = JSON.stringify(data)
    debug(`[fetchData] ClickHouse response (${query_id}):`, {
      dataType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A',
      preview: rawText.substring(0, 500),
    })
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Test package| `bun run test:packages` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope**:
- `packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts`

**Out of scope**:
- Other logging configurations or file changes.

## Git workflow

- Branch: `advisor/020-conditional-json-serialization`
- Commit message: `perf: avoid unconditional JSON stringify of large response in debug logs`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Wrap JSON.stringify in a debug check

Open [clickhouse-fetch.ts](file:///Users/duet/project/clickhouse-monitor/packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts).
1. Locate lines 261-267 where `JSON.stringify(data)` is executed.
2. Check if `@chm/logger` exposes a way to know if debug logging is enabled, or use the environment variables check `process.env.DEBUG` or `process.env.LOG_LEVEL === 'debug'`.
   * Wait! Let's check `packages/logger/src/index.ts` to see what is exported. Let's see if we have `isDebugEnabled` or similar. If not, we can import or define a simple check or check if debug logging is checked inside `debug` itself.
   * If there is no check, we can check if `process.env.DEBUG` or similar is set, OR we can introduce a conditional check like:
```typescript
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      const rawText = JSON.stringify(data)
      debug(`[fetchData] ClickHouse response (${query_id}):`, {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        preview: rawText.substring(0, 500),
      })
    }
```
   * Alternatively, we can serialize the data lazily or keep the stringify only when needed:
```typescript
    // For debugging: serialize the parsed data to see what we got (only when in development or debug mode)
    const isDebug = typeof process !== 'undefined' && (process.env.DEBUG || process.env.NODE_ENV === 'development');
    if (isDebug) {
      const rawText = JSON.stringify(data)
      debug(`[fetchData] ClickHouse response (${query_id}):`, {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A',
        preview: rawText.substring(0, 500),
      })
    }
```

**Verify**: Run `bun run lint` and `bun run test:packages` to ensure the package compile succeeds.

## Test plan

- Run the unit tests via `bun run test:packages` and `bun run test:unit`.

## Done criteria

- [ ] Unconditional `JSON.stringify` removed from the main execution path.
- [ ] Debug logs for query responses are only processed/serialized when debug mode is enabled.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- None.
