# Plan 015: Decommission Legacy Next.js Dashboard

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- .github/workflows/cloudflare.yml apps/dashboard`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **State**: DONE (2026-06-14, branch `chore/promote-tsr-dashboard-1392`)
- **Priority**: P3
- **Effort**: M
- **Risk**: MED (requires DNS redirect to new dashboard worker)
- **Depends on**: completion of all TanStack Start page migrations (Phase 4 of the roadmap)
- **Category**: migration
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The project is undergoing a Next.js to TanStack Start migration. The new `dashboard-tsr` application is built to replace the legacy Next.js `dashboard` application. Currently, both applications are built and deployed in parallel by CI workflows, wasting edge assets, runtime deploy minutes, and developer maintenance resources. 

Once page and feature parity are 100% complete in `dashboard-tsr`, the legacy Next.js application can be decommissioned, its workflow steps disabled, and its directories deleted.

> [!IMPORTANT]
> **This plan is BLOCKED** until the TanStack Start migration is 100% complete and verified under Phase 7 of the roadmap. Do not execute this plan early.

## Current state

The legacy Next.js app is located at `apps/dashboard/` and has deployment steps defined in `.github/workflows/cloudflare.yml`:

```yaml
# .github/workflows/cloudflare.yml:78-83
      - name: Next.js Cache
        uses: actions/cache@v5
        with:
          path: apps/dashboard/.next/cache
```

And:

```yaml
# .github/workflows/cloudflare.yml:101-103
      - name: Build Next.js app for Cloudflare
        working-directory: apps/dashboard
        run: bun run cf:build
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Deploy TSR| `cd apps/dashboard-tsr && bun run cf:deploy` | deploys the primary dashboard successfully |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/cloudflare.yml`
- `.github/workflows/test.yml`
- `package.json`
- `apps/dashboard` (delete)

**Out of scope**:
- Other application configuration files.

## Git workflow

- Branch: `advisor/015-decommission-nextjs-dashboard`
- Commit message: `chore: decommission legacy next.js dashboard and remove code`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Verify 100% Migration Parity (PRE-REQUISITE)

Confirm that the new `dashboard-tsr` application is fully functional, matches all route configurations, and has passed all Cypress E2E tests. 

If any pages or sub-systems (like AI agent conversations, custom MCP server configurations) are still non-functional, **STOP** and report back.

### Step 2: Disable Next.js build/deploy in cloudflare.yml

Open [.github/workflows/cloudflare.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/cloudflare.yml). 
1. Remove all steps related to building and deploying `apps/dashboard`.
2. Keep only the steps related to building and deploying `apps/dashboard-tsr` (renaming the target domain from `dash-tsr.chmonitor.dev` to `dash.chmonitor.dev` as the production route target).

### Step 3: Remove next.js tests from test.yml

Open [.github/workflows/test.yml](file:///Users/duet/project/clickhouse-monitor/.github/workflows/test.yml). Remove steps in the `unit-tests`, `component-test`, and `e2e-test` jobs that execute in the `apps/dashboard` directory.

### Step 4: Delete the apps/dashboard directory

Delete the entire legacy `apps/dashboard` directory from the repository working tree.

```bash
git rm -rf apps/dashboard
```

Remove `"apps/dashboard"` from the `"workspaces"` array in the root `package.json`.

**Verify**: Run `bun install` at the root and verify lockfile updates. Run `bun run build:tsr` to ensure the project still builds.

## Test plan

- Run `bun install` and `bun run build:tsr` from root.
- Ensure the CI workflows build and deploy the `dashboard-tsr` application on `dash.chmonitor.dev` without errors.

## Done criteria

- [ ] `apps/dashboard` directory deleted.
- [ ] Next.js steps removed from CI workflows.
- [ ] Root package workspaces list updated.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If the TanStack Start migration is not yet complete.
- If deleting `apps/dashboard` breaks shared package dependencies or import aliases.

## Maintenance notes

- None.
