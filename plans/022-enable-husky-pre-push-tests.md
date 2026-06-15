# Plan 022: Enable Husky Pre-Push Tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 29d5f8ec..HEAD -- .husky/pre-push`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: dx
- **Planned at**: commit `29d5f8ec`, 2026-06-14
- **State**: TODO

## Why this matters

In the legacy Next.js era, unit tests were skipped in the Husky pre-push hook due to a hanging issue with Jest. 
Now that the project has transitioned to Bun and uses the fast, native `bun test` runner for packages and dashboard tests, tests run in seconds and do not hang. 
Re-enabling test runs in the pre-push hook prevents pushing broken code to remote branches, saving CI queue times and keeping the branch build status healthy.

## Current state

In `.husky/pre-push`:
```bash
#!/usr/bin/env sh

# ─────────────────────────────────────────────────────────────────────────────
# Pre-push hook for clickhouse-monitor
# Runs: Full Biome check
# Note: Build verification runs in CI; tests skipped due to Jest hanging issue
# ─────────────────────────────────────────────────────────────────────────────

echo "🔍 Running full Biome check..."
bun run check

echo "✅ Pre-push checks passed!"
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Test hook | `sh .husky/pre-push` | exit 0, tests and check run successfully |

## Scope

**In scope**:
- `.husky/pre-push`

**Out of scope**:
- Modifications to other hooks or test runner binaries.

## Git workflow

- Branch: `advisor/022-enable-husky-pre-push-tests`
- Commit message: `dx: re-enable unit and package tests in husky pre-push hook`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Update pre-push hook to run fast tests

Open [.husky/pre-push](file:///Users/duet/project/clickhouse-monitor/.husky/pre-push).
1. Add commands to run the dashboard unit tests (`bun run test:unit`) and packages tests (`bun run test:packages`) alongside the Biome check:
```bash
#!/usr/bin/env sh

# ─────────────────────────────────────────────────────────────────────────────
# Pre-push hook for clickhouse-monitor
# Runs: Biome check, dashboard unit tests, and packages tests
# ─────────────────────────────────────────────────────────────────────────────

echo "🔍 Running full Biome check..."
bun run check || exit 1

echo "🧪 Running dashboard unit tests..."
bun run test:unit || exit 1

echo "📦 Running package unit tests..."
bun run test:packages || exit 1

echo "✅ Pre-push checks passed!"
```

### Step 2: Validate hook execution

1. Verify the hook file is executable:
   ```bash
   chmod +x .husky/pre-push
   ```
2. Manually execute the pre-push script:
   ```bash
   sh .husky/pre-push
   ```
   Confirm that it runs the Biome check and both test suites, exiting with status 0.

## Test plan

- Run `sh .husky/pre-push` locally and verify it executes both check and test suites.

## Done criteria

- [ ] `.husky/pre-push` updated to execute `bun run test:unit` and `bun run test:packages`.
- [ ] Script successfully exits with status code 0 when all tests pass.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If the test suite runs slow (>30s) or hangs. (Note: standard `bun test` takes <5s on local developer machines).
