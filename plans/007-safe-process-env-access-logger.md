# Plan 007: Safe process.env Access in packages/logger

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- packages/logger/src/index.ts`
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

The `@chm/logger` package is used across the entire monorepo, including client apps, packages, and serverless worker routes. At module load time, the logger accesses `process.env.NODE_ENV` and `process.env.DEBUG` directly. 

In serverless edge runtimes (e.g. some Cloudflare Workers environments) or direct browser runtime loads where `process` is not globally defined, referencing the `process` variable directly at module evaluation time throws an immediate `ReferenceError: process is not defined` crash. Adding a safe guard check prevents startup errors in non-node runtimes.

## Current state

The file `packages/logger/src/index.ts` has the following top-level declarations:

```typescript
// packages/logger/src/index.ts:24-25
const isDevelopment = process.env.NODE_ENV === 'development'
const debugEnabled = process.env.DEBUG === 'true'
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Test      | `bun run test:packages` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/logger/src/index.ts`

**Out of scope**:
- Other files in `packages/logger/src/`

## Git workflow

- Branch: `advisor/007-safe-process-env-access-logger`
- Commit message: `fix(logger): safely guard process.env access for browser and serverless runtimes`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Guard process.env variables check in packages/logger/src/index.ts

Open [packages/logger/src/index.ts](file:///Users/duet/project/clickhouse-monitor/packages/logger/src/index.ts). Replace lines 24-25:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const debugEnabled = process.env.DEBUG === 'true'
```

With:

```typescript
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
const debugEnabled = typeof process !== 'undefined' && process.env?.DEBUG === 'true'
```

**Verify**: `bun run type-check` returns exit 0.

### Step 2: Run tests

Verify the packages tests run successfully with the guarded logger:
`bun run test:packages`

## Test plan

- Run `bun run test:packages` to confirm no logging regressions occur.

## Done criteria

- [ ] `bun run type-check` exits 0.
- [ ] `bun run test:packages` passes.
- [ ] Logger can be imported in environments without a global `process` variable without throwing ReferenceError.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If compiling the logger package fails.

## Maintenance notes

- None.
