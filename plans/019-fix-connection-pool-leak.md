# Plan 019: ClickHouse Connection Pool Connection Leak and Cleanup Failure

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 29d5f8ec..HEAD -- packages/clickhouse-client/src/clickhouse/clickhouse-client.ts packages/clickhouse-client/src/clickhouse/connection-pool.ts packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: correctness
- **Planned at**: commit `29d5f8ec`, 2026-06-14
- **State**: TODO

## Why this matters

The ClickHouse connection pool currently increments `pooled.inUse` whenever a client is leased via `getClient()`. However, there is no corresponding release/decrement mechanism when the query finishes. Because of this, once a pooled connection is used, `inUse` remains greater than 0 indefinitely. 

The background `cleanupStaleClients` task only cleans up idle connections if `pooled.inUse === 0`. Because `inUse` is never decremented, idle connections are never cleaned up, resulting in a TCP connection and memory leak in long-running processes.

To fix this, we will add a `releaseClient` function to `clickhouse-client` and use it inside a `finally` block in `fetchData` and other query-execution methods in `clickhouse-fetch.ts`.

## Current state

In `packages/clickhouse-client/src/clickhouse/clickhouse-client.ts`:
```typescript
  // Update usage stats
  pooled.inUse++

  // Return the pooled client
  return Promise.resolve(pooled.client)
```

In `packages/clickhouse-client/src/clickhouse/connection-pool.ts`:
```typescript
export function cleanupStaleClients(): void {
  const now = Date.now()
  const staleKeys: PoolKey[] = []

  for (const [key, pooled] of clientPool.entries()) {
    if (now - pooled.lastUsed > CLIENT_TIMEOUT && pooled.inUse === 0) {
      staleKeys.push(key)
    }
  }
  ...
}
```

In `packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts`:
```typescript
    const client = await getClient({
      clickhouseSettings,
      clientConfig,
      hostId,
    })
    
    const resultSet = await client.query({
      query: QUERY_COMMENT + effectiveQuery,
      format,
      query_params,
      clickhouse_settings,
    })
    ...
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Test package| `bun run test:packages` | exit 0, all tests pass |
| Test app  | `bun run test:unit` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/clickhouse-client/src/clickhouse/clickhouse-client.ts`
- `packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts`

**Out of scope**:
- Modifications to any files outside `packages/clickhouse-client`.

## Git workflow

- Branch: `advisor/019-fix-connection-pool-leak`
- Commit message: `fix: resolve clickhouse connection pool leak by releasing client`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Add releaseClient function to clickhouse-client.ts

Open [clickhouse-client.ts](file:///Users/duet/project/clickhouse-monitor/packages/clickhouse-client/src/clickhouse/clickhouse-client.ts).
1. Add a `releaseClient` function that accepts `hostId` (or clientConfig) and decrements `inUse` for that pooled client. It should also clamp `inUse` to a minimum of 0:
```typescript
export const releaseClient = ({
  clientConfig,
  hostId,
  web,
}: {
  clientConfig?: ClickHouseConfig
  hostId?: number
  web?: boolean
}): void => {
  const isWeb = web === true || (web === undefined && isCloudflareWorkers())
  const config = clientConfig ? clientConfig : getAndValidateClientConfig(hostId ?? 0)
  const poolKey = getPoolKey(config, isWeb)
  const pooled = clientPool.get(poolKey)
  if (pooled) {
    pooled.inUse = Math.max(0, pooled.inUse - 1)
  }
}
```
2. Export `releaseClient` from `clickhouse-client.ts`.

### Step 2: Update clickhouse-fetch.ts to release client on query completion

Open [clickhouse-fetch.ts](file:///Users/duet/project/clickhouse-monitor/packages/clickhouse-client/src/clickhouse/clickhouse-fetch.ts).
1. Import `releaseClient` from `./clickhouse-client`.
2. Locate `fetchData` and other methods that lease a client via `getClient`. Wrap the query execution block (where `client.query` and `resultSet.json()` are called) in a `try...finally` block.
3. In the `finally` block, call `releaseClient({ clientConfig, hostId, web })`.
   * For example, in `fetchData`:
```typescript
  let clientReleased = false
  try {
    const client = await getClient({
      clickhouseSettings,
      clientConfig,
      hostId,
    })
    // ... execution code ...
  } finally {
    releaseClient({ clientConfig, hostId })
  }
```
   * Repeat this pattern for all locations calling `getClient` in `clickhouse-fetch.ts` (there are ~3 sites: `fetchData`, `checkDatabaseConnection`, `pingClient`).

**Verify**: Run `bun run test:packages` and `bun run test:unit` to ensure everything compiles and all tests pass.

### Step 3: Add unit tests for connection pool lease/release

Open `packages/clickhouse-client/src/clickhouse/__tests__/connection-pool.test.ts` (or create it if absent, or add tests in `packages/clickhouse-client/src/__tests__/clickhouse.test.ts`).
1. Write a unit test that calls `getClient()`, asserts that the pool stats show `inUse === 1`.
2. Call `releaseClient()` and assert that `inUse === 0`.
3. Assert that `cleanupStaleClients` cleans up the client after `CLIENT_TIMEOUT`.

**Verify**: Run `bun run test:packages` to confirm your unit tests pass.

## Test plan

- Run `bun run test:packages` to verify the client package tests.
- Run `bun run type-check` to verify no typescript compile issues.

## Done criteria

- [ ] `releaseClient` function introduced in `clickhouse-client.ts` and exported.
- [ ] All `getClient` leases in `clickhouse-fetch.ts` are matched with a `finally` block releasing the client.
- [ ] Stale connection cleanup works successfully as proven by unit tests.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If release calls trigger runtime exceptions or block the query execution.
- If tsconfig paths or Biome lint rules are violated.
