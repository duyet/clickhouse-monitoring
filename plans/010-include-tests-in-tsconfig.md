# Plan 010: Typecheck Test Files in apps/dashboard-tsr via Dedicated tsconfig

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/tsconfig.json`
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

The TypeScript configuration (`tsconfig.json`) for `apps/dashboard-tsr` excludes test files (such as `**/*.test.ts`, `**/*.test.tsx`, and `**/__tests__/**`) from compilation to prevent test types (like Bun/Jest or Cypress globals) from polluting the application's production edge runtime build. 

However, this means that running the typecheck script `tsc --noEmit` completely ignores all test files. Any broken imports, syntax errors, or mismatched type interfaces introduced into the test files go completely undetected. Creating a dedicated `tsconfig.test.json` allows type-checking the test files in isolation during builds and pull request verification.

## Current state

The file `apps/dashboard-tsr/tsconfig.json` excludes test files:

```json
// apps/dashboard-tsr/tsconfig.json:53-70
  "exclude": [
    "node_modules",
    "dist",
    ".output",
    ".wrangler",
    ".turbo",
    "coverage",
    "cypress",
    "cypress.config.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.cy.ts",
    "**/*.cy.tsx",
    "**/__tests__/**",
    "**/__mocks__/**"
  ]
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `cd apps/dashboard-tsr && bun run type-check` | exit 0, no errors |
| Test Check| `cd apps/dashboard-tsr && bunx tsc -p tsconfig.test.json --noEmit` | exit 0, no errors |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `apps/dashboard-tsr/tsconfig.test.json` (create)
- `apps/dashboard-tsr/package.json`

**Out of scope**:
- Modifications to `apps/dashboard-tsr/tsconfig.json` (retaining the production exclusions is intentional to avoid build pollution).

## Git workflow

- Branch: `advisor/010-include-tests-in-tsconfig`
- Commit message: `test(dashboard-tsr): add tsconfig.test.json to type-check test files`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Create tsconfig.test.json in dashboard-tsr

Create a new file `apps/dashboard-tsr/tsconfig.test.json` that extends the main config, includes the test files, and includes Bun/Jest/Node types.

Content for [tsconfig.test.json](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/tsconfig.test.json):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["node", "@cloudflare/workers-types", "vite/client", "bun-types"]
  },
  "include": [
    "src",
    "vite.config.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/__tests__/**"
  ],
  "exclude": [
    "node_modules",
    "dist",
    ".output",
    ".wrangler",
    ".turbo",
    "coverage",
    "cypress",
    "cypress.config.ts"
  ]
}
```

### Step 2: Add type-check:test script to package.json

Open [package.json](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/package.json) and modify the scripts:

Add:
```json
    "type-check:test": "tsc -p tsconfig.test.json --noEmit",
```
And update the main `"type-check"` or `"build"` script if desired, or let CI run them separately.
Let's keep the script simple:
`"type-check:test": "tsc -p tsconfig.test.json --noEmit"`

**Verify**: Run `cd apps/dashboard-tsr && bun run type-check:test` to check all test files. Correct any TypeScript compiler errors found in test files (e.g. stale mock types).

## Test plan

- Run `cd apps/dashboard-tsr && bun run type-check:test` and confirm it exits with 0 errors.

## Done criteria

- [ ] `tsconfig.test.json` exists in `apps/dashboard-tsr`.
- [ ] `bun run type-check:test` successfully type-checks the test files in `apps/dashboard-tsr`.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If adding `bun-types` causes namespace conflicts with edge types in compilation. If so, limit target types in `tsconfig.test.json`.

## Maintenance notes

- None.
