# Plan 012: Add Root-Level Scripts for apps/dashboard-tsr Development

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The primary dashboard application is migrating from Next.js (`apps/dashboard`) to TanStack Start (`apps/dashboard-tsr`). Because `apps/dashboard-tsr` runs on an isolated Vite 8 toolchain to prevent dependency bloating in the root workspaces lockfile, it is excluded from the monorepo's root package workspaces array. 

However, this means developers cannot use Turborepo or root-level scripts to run the new dashboard in dev mode or build it. They must manually change directories (`cd apps/dashboard-tsr`) to execute commands, creating friction in developer onboarding and local iteration loops. Adding explicit root-level scripts resolves this friction.

## Current state

The root `package.json` contains scripts for other isolated apps (like `landing` and `docs`), but lacks scripts for `dashboard-tsr`:

```json
// package.json:20-22
    "build": "turbo run build",
    "build:landing": "cd apps/landing && bun install --frozen-lockfile && bun run build",
    "build:docs": "cd apps/docs && bun install --frozen-lockfile && bun run build",
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Dev script| `bun run dev:tsr` | starts Vite development server on port 3000 |
| Build script| `bun run build:tsr` | compiles/prerenders the TanStack Start app |

## Scope

**In scope** (the only files you should modify):
- `package.json` (root)

**Out of scope**:
- Other application configuration files.

## Git workflow

- Branch: `advisor/012-add-root-scripts-tsr`
- Commit message: `dx(root): add root-level scripts for dashboard-tsr build and dev`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Add scripts to root package.json

Open the root [package.json](file:///Users/duet/project/clickhouse-monitor/package.json). Add the following scripts inside the `"scripts"` block:

```json
    "dev:tsr": "cd apps/dashboard-tsr && bun run dev",
    "build:tsr": "cd apps/dashboard-tsr && bun run build",
    "cf:deploy:tsr": "cd apps/dashboard-tsr && bun run cf:deploy",
```

Add these scripts around line 23 (after `"build:docs"`).

**Verify**: Run `bun run build:tsr` from the root directory to verify that the build compiles successfully without manually changing directory.

## Test plan

- Run `bun run build:tsr` from root and confirm compilation completes with exit 0.

## Done criteria

- [ ] Root-level scripts `"dev:tsr"`, `"build:tsr"`, and `"cf:deploy:tsr"` exist in `package.json`.
- [ ] Root scripts execute target actions in `apps/dashboard-tsr` correctly.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If adding these scripts breaks JSON syntax or Biome formatting in root `package.json`.

## Maintenance notes

- None.
