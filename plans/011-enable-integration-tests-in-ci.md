# Plan 011: Enable clickhouse-client Integration Tests in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- packages/clickhouse-client/src/__tests__/integration-environment.test.ts .github/workflows/test.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The `@chm/clickhouse-client` package contains integration tests in `integration-environment.test.ts` to verify its client connection logic, query execution, and compatibility with the database. Currently, these integration tests are hard-skipped in CI environments (by checking if `process.env.CI === 'true'`). 

This means we never verify that the client connects and runs queries successfully against a real database during automated CI builds, even in jobs (like `test-queries-config` or `e2e-test`) where a live ClickHouse container is active. Removing the hard-coded skip check and using a dynamic connection health check allows running these tests in environments where a database is available.

## Current state

The file `packages/clickhouse-client/src/__tests__/integration-environment.test.ts` disables tests in CI and test environments:

```typescript
// packages/clickhouse-client/src/__tests__/integration-environment.test.ts:15-32
async function isClickHouseAvailable(): Promise<boolean> {
  // Always skip in CI environment to prevent hanging
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
    return false
  }

  if (!process.env.CLICKHOUSE_HOST) {
    // Skip if no ClickHouse config
    return false
  }

  try {
    // Mock the fetchData call in test environment to prevent hanging
    if (process.env.NODE_ENV === 'test') {
      return false
    }
```

And `.github/workflows/test.yml` does not execute package integration tests inside jobs that provision the ClickHouse container.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Test package| `bun run test:packages` | exit 0, tests pass (integration checks skipped locally if Clickhouse is not running) |
| Run with DB| `docker run -d -p 8123:8123 --name ch-test clickhouse/clickhouse-server && export CLICKHOUSE_HOST=http://localhost:8123 && bun run test:packages` | exit 0, integration tests run and pass |

## Scope

**In scope** (the only files you should modify):
- `packages/clickhouse-client/src/__tests__/integration-environment.test.ts`
- `.github/workflows/test.yml`

**Out of scope**:
- Modifications to client source files.

## Git workflow

- Branch: `advisor/011-enable-integration-tests-in-ci`
- Commit message: `test: enable clickhouse-client integration tests in CI when database is active`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Remove hardcoded CI skip from integration-environment.test.ts

Open [integration-environment.test.ts](file:///Users/duet/project/clickhouse-monitor/packages/clickhouse-client/src/__tests__/integration-environment.test.ts). Modify `isClickHouseAvailable()` to remove the hardcoded `CI` check and allow connection probes in test mode if `CLICKHOUSE_HOST` is explicitly set.

Replace lines 15-32:
```typescript
async function isClickHouseAvailable(): Promise<boolean> {
  // Always skip in CI environment to prevent hanging
  if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
    return false
  }

  if (!process.env.CLICKHOUSE_HOST) {
    // Skip if no ClickHouse config
    return false
  }

  try {
    // Mock the fetchData call in test environment to prevent hanging
    if (process.env.NODE_ENV === 'test') {
      return false
    }
```

With:
```typescript
async function isClickHouseAvailable(): Promise<boolean> {
  if (!process.env.CLICKHOUSE_HOST) {
    // Skip if no ClickHouse config
    return false
  }

  try {
    const { fetchData } = await import(
      new URL(
        '../clickhouse/clickhouse-fetch.ts?test=integration',
        import.meta.url
      ).href
    )
```

*(Note: We preserve the 2-second timeout health check using `Promise.race` already implemented in the file. If the connection fails or times out, the test suite will log skipped warnings instead of throwing errors or hanging the CI run).*

**Verify**: Run `bun run test:packages` locally. It should skip the integration tests gracefully if no ClickHouse instance is running.

### Step 2: Update test-queries-config job in CI to run packages tests

Open [.github/workflows/test.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/test.yml). In the `test-queries-config` job (which provisions ClickHouse and Keeper service containers), add a step to run package tests after the query configurations test step.

In the `test-queries-config` job:
```yaml
// .github/workflows/test.yml:312-315
      - name: Test queries config
        working-directory: apps/dashboard
        run: bun run test:query-config
```

Append the following step:
```yaml
      - name: Run package integration tests
        run: bun run test:packages
```

**Verify**: The integration tests will now execute successfully in CI because they run in a job with a live ClickHouse container.

## Test plan

- Push changes to a branch and monitor the `test-queries-config` job output on GitHub. Ensure `packages/clickhouse-client` integration tests run (rather than logging "Skipping ClickHouse integration tests - database not available").

## Done criteria

- [ ] `.github/workflows/test.yml` runs successfully.
- [ ] Integration tests run in CI when the database service is present.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If the integration tests hang or timeout during the `test-queries-config` job (ensure the 2-second connection timeout works).
