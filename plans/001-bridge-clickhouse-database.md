# Plan 001: Bridge CLICKHOUSE_DATABASE and EVENTS_TABLE_NAME on Cloudflare Workers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/src/lib/api/server-env.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

In Cloudflare Workers deployments of the `dashboard-tsr` application, serverless route handlers read ClickHouse environment configurations from the worker's ambient `env` bindings and bridge them onto `process.env` so the shared `@chm/clickhouse-client` library can parse and use them. 

Currently, `CLICKHOUSE_DATABASE` and `EVENTS_TABLE_NAME` are omitted from the bridged environment keys list. This causes these parameters to always fall back to default values (such as `'system'` for the database and `system.monitoring_events` for events), which will fail or point to the wrong database when deployed to a Cloudflare Workers environment where a custom database namespace is configured.

## Current state

The file `apps/dashboard-tsr/src/lib/api/server-env.ts` defines `CLICKHOUSE_ENV_KEYS`:

```typescript
// apps/dashboard-tsr/src/lib/api/server-env.ts:21-27
const CLICKHOUSE_ENV_KEYS = [
  'CLICKHOUSE_HOST',
  'CLICKHOUSE_USER',
  'CLICKHOUSE_PASSWORD',
  'CLICKHOUSE_NAME',
  'CLICKHOUSE_MAX_EXECUTION_TIME',
] as const
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
- `apps/dashboard-tsr/src/lib/api/server-env.ts`
- `apps/dashboard-tsr/src/lib/api/__tests__/server-env.test.ts` (create)

**Out of scope**:
- Other files in `apps/dashboard-tsr/src/lib/api/` or `packages/clickhouse-client/`

## Git workflow

- Branch: `advisor/001-bridge-clickhouse-database`
- Commit message: `fix(dashboard-tsr): bridge CLICKHOUSE_DATABASE and EVENTS_TABLE_NAME on workers`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Add the missing keys to server-env.ts

Open [server-env.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/lib/api/server-env.ts) and add `'CLICKHOUSE_DATABASE'` and `'EVENTS_TABLE_NAME'` to `CLICKHOUSE_ENV_KEYS`.

Target structure:
```typescript
const CLICKHOUSE_ENV_KEYS = [
  'CLICKHOUSE_HOST',
  'CLICKHOUSE_USER',
  'CLICKHOUSE_PASSWORD',
  'CLICKHOUSE_NAME',
  'CLICKHOUSE_MAX_EXECUTION_TIME',
  'CLICKHOUSE_DATABASE',
  'EVENTS_TABLE_NAME',
] as const
```

**Verify**: `cd apps/dashboard-tsr && bun run type-check` returns exit 0.

### Step 2: Create a unit test for server-env.ts

Create a new file `apps/dashboard-tsr/src/lib/api/__tests__/server-env.test.ts` to test `bridgeClickHouseEnv`.

Template for [server-env.test.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/lib/api/__tests__/server-env.test.ts):
```typescript
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { bridgeClickHouseEnv } from '../server-env'

describe('bridgeClickHouseEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Clear ClickHouse env keys from process.env before each test
    const keys = [
      'CLICKHOUSE_HOST',
      'CLICKHOUSE_USER',
      'CLICKHOUSE_PASSWORD',
      'CLICKHOUSE_NAME',
      'CLICKHOUSE_MAX_EXECUTION_TIME',
      'CLICKHOUSE_DATABASE',
      'EVENTS_TABLE_NAME',
    ]
    for (const key of keys) {
      delete process.env[key]
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should copy ClickHouse environment variables to process.env', () => {
    const mockBindings = {
      CLICKHOUSE_HOST: 'http://my-host:8123',
      CLICKHOUSE_USER: 'admin',
      CLICKHOUSE_PASSWORD: 'secretpassword',
      CLICKHOUSE_DATABASE: 'custom_db',
      EVENTS_TABLE_NAME: 'custom_events',
    }

    bridgeClickHouseEnv(mockBindings)

    expect(process.env.CLICKHOUSE_HOST).toBe('http://my-host:8123')
    expect(process.env.CLICKHOUSE_USER).toBe('admin')
    expect(process.env.CLICKHOUSE_PASSWORD).toBe('secretpassword')
    expect(process.env.CLICKHOUSE_DATABASE).toBe('custom_db')
    expect(process.env.EVENTS_TABLE_NAME).toBe('custom_events')
  })

  it('should not overwrite existing process.env values', () => {
    process.env.CLICKHOUSE_HOST = 'http://existing:8123'
    const mockBindings = {
      CLICKHOUSE_HOST: 'http://new-host:8123',
    }

    bridgeClickHouseEnv(mockBindings)

    expect(process.env.CLICKHOUSE_HOST).toBe('http://existing:8123')
  })
})
```

**Verify**: `cd apps/dashboard-tsr && bun test src/lib/api/__tests__/server-env.test.ts` passes.

## Test plan

- Execute `cd apps/dashboard-tsr && bun test src/lib/api/__tests__/server-env.test.ts`
- Expected: All tests pass, verifying correct bridging behavior for all ClickHouse environment variables.

## Done criteria

- [ ] `cd apps/dashboard-tsr && bun run type-check` exits 0 with no errors.
- [ ] `cd apps/dashboard-tsr && bun test src/lib/api/__tests__/server-env.test.ts` runs and passes.
- [ ] Biome linter runs successfully (`biome lint .`) on the workspace.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If `CLICKHOUSE_ENV_KEYS` is not located around line 21 of `apps/dashboard-tsr/src/lib/api/server-env.ts`.
- If a test failure occurs that cannot be resolved after two attempts.

## Maintenance notes

- Any new environment variable introduced for ClickHouse client connectivity (e.g. database schema checks, SSL/TLS certifications) must also be added to `CLICKHOUSE_ENV_KEYS` to be bridged correctly under Cloudflare Workers.
