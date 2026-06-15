# Plan 023: Decommission Cypress Component Tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 29d5f8ec..HEAD -- apps/dashboard/cypress.config.ts apps/dashboard/package.json .github/workflows/test.yml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: testing
- **Planned at**: commit `29d5f8ec`, 2026-06-14
- **State**: TODO

## Why this matters

The repository formerly had Cypress component tests for React components under `apps/dashboard/src`. Those tests have since been deleted, and no `.cy.ts` or `.cy.tsx` files remain. 

However, the component test configurations, package scripts (`test:component` and `test:component:headless`), and the CI job `component-test` in `.github/workflows/test.yml` are still active. The CI pipeline continues to spin up a headless runner to run an empty component suite, wasting time and resources.

We will clean up these dead configurations, scripts, and CI workflows.

## Current state

In `apps/dashboard/cypress.config.ts`:
```typescript
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    supportFile: false,
    specPattern: 'src/**/*.cy.{ts,tsx}',
  },
```

In `apps/dashboard/package.json`:
```json
    "test:component": "cypress open --component",
    "test:component:headless": "cypress run --component",
```

In `.github/workflows/test.yml`:
```yaml
  # Cypress component tests cover isolated React/component behavior
  component-test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      ...
      - name: Run component tests
        working-directory: apps/dashboard
        run: bun run test:component:headless
        env:
          CYPRESS_BROWSER: chrome
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope**:
- `apps/dashboard/cypress.config.ts`
- `apps/dashboard/package.json`
- `.github/workflows/test.yml`

**Out of scope**:
- E2E Cypress tests or global Cypress config parameters outside the `component` block.

## Git workflow

- Branch: `advisor/023-decommission-cypress-component-tests`
- Commit message: `test: decommission cypress component tests configuration and CI pipeline`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Remove component block from cypress.config.ts

Open [cypress.config.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard/cypress.config.ts).
1. Delete the `component` config block:
```typescript
  // Delete lines 25-32:
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    supportFile: false,
    specPattern: 'src/**/*.cy.{ts,tsx}',
  },
```

### Step 2: Remove component scripts from apps/dashboard/package.json

Open [package.json](file:///Users/duet/project/clickhouse-monitor/apps/dashboard/package.json).
1. Delete scripts `test:component` and `test:component:headless` (lines 28-29).

### Step 3: Remove component-test job from CI workflow

Open [test.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/test.yml).
1. Locate the `component-test` job declaration (lines 75-114).
2. Delete the entire job definition.

**Verify**: Run `bun run lint` and `bun run build` to verify the build is unaffected.

## Test plan

- Run `bun run lint` and ensure there are no configuration or linting issues.
- Run `bun run type-check` to verify no compilation issues.

## Done criteria

- [ ] `component` block removed from `cypress.config.ts`.
- [ ] Component scripts removed from `apps/dashboard/package.json`.
- [ ] `component-test` job removed from `.github/workflows/test.yml`.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If E2E Cypress tests are broken or Cypress configuration fails to load.
