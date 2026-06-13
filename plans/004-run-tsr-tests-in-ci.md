# Plan 004: Run apps/dashboard-tsr Unit Tests in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- .github/workflows/test.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The monorepo contains a legacy Next.js app (`apps/dashboard`) and a new TanStack Start app (`apps/dashboard-tsr`). While the Next.js unit tests are actively run in CI, the unit tests for `dashboard-tsr` are completely ignored by the GitHub Actions workflows. 

This creates a blind spot where code changes in the new dashboard application could introduce syntax errors, broken imports, or logic regressions that are never caught by automated pull request tests.

## Current state

The workflow file `.github/workflows/test.yml` contains a `unit-tests` job:

```yaml
# .github/workflows/test.yml:29-64
  unit-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v6
      # ...
      - name: Install dependencies
        run: bun install

      - name: Run Bun tests with coverage
        working-directory: apps/dashboard
        run: bun run test:coverage

      - name: Run workspace package tests with coverage
        run: bun run test:packages
```

Note that `apps/dashboard-tsr` is NOT in root workspaces, so running `bun install` at the root does not install `apps/dashboard-tsr` dependencies. A separate `bun install` must be run inside `apps/dashboard-tsr`.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Verify yml| `actionlint .github/workflows/test.yml` (if available) | no syntax errors |
| Test run  | `cd apps/dashboard-tsr && bun install && bun run test` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/test.yml`

**Out of scope**:
- Modifications to the tests themselves under `apps/dashboard-tsr/src/`.

## Git workflow

- Branch: `advisor/004-run-tsr-tests-in-ci`
- Commit message: `ci: execute apps/dashboard-tsr unit tests in unit-tests job`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Update test.yml to run TSR tests

Open [.github/workflows/test.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/test.yml) and add steps to the `unit-tests` job after the package tests step (around line 64) to:
1. Cache `dashboard-tsr` node_modules (optional but recommended for speed).
2. Install dependencies for `apps/dashboard-tsr`.
3. Run unit tests in `apps/dashboard-tsr`.

Example additions:
```yaml
      - name: Bun Cache (TSR)
        uses: actions/cache@v5
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-tsr-v1-${{ hashFiles('apps/dashboard-tsr/bun.lock') }}
          restore-keys: |
            ${{ runner.os }}-bun-tsr-v1-

      - name: Install dashboard-tsr dependencies
        working-directory: apps/dashboard-tsr
        run: bun install

      - name: Run dashboard-tsr unit tests
        working-directory: apps/dashboard-tsr
        run: bun run test
```

Place this section right before `Upload Bun coverage to Codecov`.

**Verify**: Run `cd apps/dashboard-tsr && bun install && bun run test` locally to ensure the test suite is functional.

## Test plan

- Review the GitHub action execution on branch push to confirm that the `unit-tests` job succeeds and executes `bun run test` inside the `apps/dashboard-tsr` directory.

## Done criteria

- [ ] `.github/workflows/test.yml` is syntactically valid YAML.
- [ ] Local tests in `apps/dashboard-tsr` execute successfully.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If `test.yml` syntax errors cause the GitHub Actions parser to reject the workflow.
- If dependencies fail to install in `apps/dashboard-tsr` due to version conflicts in lockfiles.

## Maintenance notes

- When the Next.js app (`apps/dashboard`) is fully deprecated and deleted, the legacy Next.js unit tests steps in this job should be removed, leaving only the package tests and TSR tests.
