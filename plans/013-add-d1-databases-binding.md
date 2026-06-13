# Plan 013: Add D1 Database Bindings for AI Agent Conversation Storage

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/wrangler.toml apps/dashboard-tsr/scripts/patch-wrangler-env.ts`
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

The AI Agent on the dashboard has a conversation assistant panel. To persist assistant conversations across page reloads and devices, the backend API requires access to a Cloudflare D1 database binding (`CONVERSATIONS_D1`). 

Currently, `apps/dashboard-tsr/wrangler.toml` lacks D1 database configuration, and the post-build config patching script `patch-wrangler-env.ts` does not handle D1 bindings. This results in the assistant degrading to local memory, making conversation histories vanish on page reload. Adding this binding and handling it dynamically during build deployment solves this.

## Current state

The configuration `apps/dashboard-tsr/wrangler.toml` does not contain any `d1_databases` sections. 

The build patcher `apps/dashboard-tsr/scripts/patch-wrangler-env.ts` only overrides `name`, `routes`, `vars`, and `assets`:

```typescript
// apps/dashboard-tsr/scripts/patch-wrangler-env.ts:88-90
generated.name = config.name
generated.routes = config.routes
generated.vars = config.vars
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Build     | `cd apps/dashboard-tsr && bun run build` | compiles wrangler.json successfully |
| Run patch | `cd apps/dashboard-tsr && bun run scripts/patch-wrangler-env.ts` | exit 0, outputs patched stats |

## Scope

**In scope** (the only files you should modify):
- `apps/dashboard-tsr/wrangler.toml`
- `apps/dashboard-tsr/scripts/patch-wrangler-env.ts`

**Out of scope**:
- Modifications to database schema or migrations folders.

## Git workflow

- Branch: `advisor/013-add-d1-databases-binding`
- Commit message: `dx(dashboard-tsr): add D1 database binding config and build patching`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Add D1 binding configuration to wrangler.toml

Open [wrangler.toml](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/wrangler.toml). Add `[[d1_databases]]` configurations for both production and preview environments:

1. Under the top-level section:
   ```toml
   # D1 database for AI agent conversations
   [[d1_databases]]
   binding = "CONVERSATIONS_D1"
   database_name = "clickhouse-monitor-conversations"
   migrations_dir = "../../apps/dashboard/src/db/conversations-migrations"
   ```

2. Under the `[env.preview]` section:
   ```toml
   # Reuse the same conversation D1 database once database_id is provisioned
   [[env.preview.d1_databases]]
   binding = "CONVERSATIONS_D1"
   database_name = "clickhouse-monitor-conversations"
   migrations_dir = "../../apps/dashboard/src/db/conversations-migrations"
   ```

### Step 2: Update patch-wrangler-env.ts to handle CONVERSATIONS_D1 database_id

Open [patch-wrangler-env.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/scripts/patch-wrangler-env.ts). Add D1 patching logic that:
1. Resolves `CONVERSATIONS_D1_DATABASE_ID` (or `AGENT_CONVERSATIONS_D1_DATABASE_ID`) from env.
2. If the UUID is present, sets `database_id` on the `CONVERSATIONS_D1` binding.
3. If the UUID is absent, strips the `CONVERSATIONS_D1` binding from `generated.d1_databases` (same behavior as `prepare-dashboard-wrangler.ts` to prevent Wrangler from throwing errors on unprovisioned database bindings).

Target code insertion in `patch-wrangler-env.ts` (around line 91, after `generated.vars = config.vars`):
```typescript
// --- Patch D1 databases ---
const conversationsDbId = (
  process.env.CONVERSATIONS_D1_DATABASE_ID ||
  process.env.AGENT_CONVERSATIONS_D1_DATABASE_ID ||
  ''
).trim()

if (conversationsDbId) {
  generated.d1_databases = (generated.d1_databases ?? []).map((db: any) => {
    if (db.binding === 'CONVERSATIONS_D1') {
      return { ...db, database_id: conversationsDbId }
    }
    return db
  })
  console.log(`   d1_databases: injected database_id for CONVERSATIONS_D1 (${conversationsDbId})`)
} else {
  // Strip CONVERSATIONS_D1 binding if database_id is not provided
  const beforeCount = (generated.d1_databases ?? []).length
  generated.d1_databases = (generated.d1_databases ?? []).filter(
    (db: any) => db.binding !== 'CONVERSATIONS_D1'
  )
  const afterCount = (generated.d1_databases ?? []).length
  if (beforeCount !== afterCount) {
    console.log('   d1_databases: removed unprovisioned CONVERSATIONS_D1 binding')
  }
}
```

**Verify**: Run `cd apps/dashboard-tsr && bun run build` and check `dist/server/wrangler.json`. If `CONVERSATIONS_D1_DATABASE_ID` is set in the shell env, verify it gets compiled into the json. If unset, verify it gets removed.

## Test plan

- Run build scripts with and without `CONVERSATIONS_D1_DATABASE_ID` defined in the environment. Verify the outputs in `dist/server/wrangler.json` are correct in both states.

## Done criteria

- [ ] `wrangler.toml` includes D1 binding declarations.
- [ ] `patch-wrangler-env.ts` correctly injects or strips the D1 database binding based on the environment variables.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If wrangler deployment commands reject the generated `wrangler.json` due to missing `database_id` errors when the D1 feature is active.
