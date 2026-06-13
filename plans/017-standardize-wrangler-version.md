# Plan 017: Standardize Wrangler Version across Monorepo Applications

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard/package.json apps/mcp/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dependencies
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The monorepo contains multiple independent applications that deploy to Cloudflare Workers (the Next.js dashboard, the TanStack Start dashboard, and the MCP worker). Currently, `apps/dashboard` and `apps/mcp` pin `"wrangler": "4.65.0"`, while the new `apps/dashboard-tsr` uses `"wrangler": "^4.97.0"`. 

Using divergent Wrangler versions can lead to deployment discrepancies, mismatched CLI options, or build output deviations between local and CI environments. Standardizing the Wrangler dependency version to `^4.97.0` ensures deployment parity.

## Current state

The file `apps/mcp/package.json` contains:
```json
// apps/mcp/package.json:15-18
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260515.0",
    "wrangler": "4.65.0"
  }
```

The file `apps/dashboard/package.json` contains:
```json
// apps/dashboard/package.json:196-198
    "webpack": "^5.97.1",
    "wrangler": "4.65.0"
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0, updates lockfile |
| Typecheck | `bun run type-check` | exit 0, no errors |

## Scope

**In scope** (the only files you should modify):
- `apps/dashboard/package.json`
- `apps/mcp/package.json`

**Out of scope**:
- Modifications to `apps/dashboard-tsr/package.json` (which already uses `^4.97.0`).

## Git workflow

- Branch: `advisor/017-standardize-wrangler-version`
- Commit message: `chore: standardize wrangler version to ^4.97.0 across packages`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Update wrangler version in apps/mcp/package.json

Open [apps/mcp/package.json](file:///Users/duet/project/clickhouse-monitor/apps/mcp/package.json). Modify line 17 to use `"wrangler": "^4.97.0"`.

### Step 2: Update wrangler version in apps/dashboard/package.json

Open [apps/dashboard/package.json](file:///Users/duet/project/clickhouse-monitor/apps/dashboard/package.json). Modify line 197 to use `"wrangler": "^4.97.0"`.

**Verify**: Run `bun install` in the repository root to apply the package manifest updates and resolve wrangler globally across all sub-apps in the lockfile. Run type-checks to ensure everything remains green.

## Test plan

- Run `bun install` at the root and verify that `bun.lock` updates cleanly.
- Run `bun run check` to verify formatting and linting.

## Done criteria

- [ ] `wrangler` version is standard on `^4.97.0` in both package manifests.
- [ ] Root `bun install` completes successfully.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If updating Wrangler introduces breaking changes or deprecation warnings in the deployment scripts.
