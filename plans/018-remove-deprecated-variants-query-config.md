# Plan 018: Remove Deprecated variants Property from QueryConfig Type Schema

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- packages/sql-builder/src/query-config-types.ts apps/dashboard-tsr/src/lib/query-config/types.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The `QueryConfig` type was originally defined with a `variants` property (an array of `QueryConfigVariant`) to handle version-specific query versions. This property has been deprecated in favor of the chronological `sql` array (`VersionedSql[]`) which offers a cleaner version compatibility layout. 

Currently, all SQL query configurations in `apps/dashboard-tsr` have successfully migrated to the new `VersionedSql[]` format, leaving zero active configurations using `variants`. Deleting the deprecated property and its types decreases cognitive load on developers, prevents dead code accretion, and cleans up the type definitions.

## Current state

The interface `QueryConfigLike` in `packages/sql-builder/src/query-config-types.ts` declares the property:

```typescript
// packages/sql-builder/src/query-config-types.ts:26-32
export interface QueryConfigVariant {
  /** @deprecated Use VersionedSql.since instead */
  versions: string
  sql: string
  description?: string
  columns?: string[]
}
```

```typescript
// packages/sql-builder/src/query-config-types.ts:46
  variants?: QueryConfigVariant[]
```

The interface `QueryConfig` in `apps/dashboard-tsr/src/lib/query-config/types.ts` declares:

```typescript
// apps/dashboard-tsr/src/lib/query-config/types.ts:93-97
  /**
   * @deprecated Use `sql: VersionedSql[]`. Legacy min/max version variants,
   * kept only so ported configs that still use it resolve correctly.
   */
  variants?: QueryConfigVariant[]
```

The interface `QueryConfig` in `apps/dashboard-tsr/src/types/query-config.ts` declares:

```typescript
// apps/dashboard-tsr/src/types/query-config.ts:498-505
  /**
   * @deprecated Use `sql: VersionedSql[]` instead. Will be removed in v0.3.0.
   *
   * Version-specific query variants (legacy format).
   * Evaluated in order - first matching variant is used.
   * Falls back to main `sql` if no variant matches.
   */
  variants?: QueryConfigVariant[]
```

No active configs in `dashboard-tsr` use `variants`.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Test package| `bun run test:packages` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `packages/sql-builder/src/query-config-types.ts`
- `packages/sql-builder/src/index.ts`
- `packages/sql-builder/src/__tests__/query-config-types.test.ts`
- `apps/dashboard-tsr/src/lib/query-config/types.ts`
- `apps/dashboard-tsr/src/types/query-config.ts`

**Out of scope**:
- Modifications to any SQL config files under `apps/dashboard-tsr/src/lib/query-config/`.

## Git workflow

- Branch: `advisor/018-remove-deprecated-variants-query-config`
- Commit message: `refactor: remove deprecated variants property from QueryConfig type schema`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Remove variants from sql-builder types

Open [query-config-types.ts](file:///Users/duet/project/clickhouse-monitor/packages/sql-builder/src/query-config-types.ts). 
1. Delete the `QueryConfigVariant` interface declaration (lines 23-32).
2. Remove the `variants` property from `QueryConfigLike` interface (line 46).

Open [index.ts](file:///Users/duet/project/clickhouse-monitor/packages/sql-builder/src/index.ts). Remove `QueryConfigVariant` from the exports list (line 37).

### Step 2: Update sql-builder package tests

Open [query-config-types.test.ts](file:///Users/duet/project/clickhouse-monitor/packages/sql-builder/src/__tests__/query-config-types.test.ts). 
1. Remove `QueryConfigVariant` from imports (line 9).
2. Delete `QueryConfigVariant` unit tests (lines 124-131).
3. Delete the `variants` acceptance test under `QueryConfigLike` (lines 169-177).

**Verify**: Run `bun run test:packages` to verify that the sql-builder tests compile and pass successfully.

### Step 3: Remove variants from apps/dashboard-tsr type declarations

1. Open [types.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/lib/query-config/types.ts). Remove `QueryConfigVariant` from imports (line 20) and delete the `variants` property from the `QueryConfig` interface (lines 93-97).
2. Open [query-config.ts](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/types/query-config.ts). Remove `QueryConfigVariant` from imports (line 4) and delete the `variants` property from `QueryConfig` interface (lines 498-505).

**Verify**: Run `cd apps/dashboard-tsr && bun run type-check` to verify that the entire dashboard compiles without any type mismatches.

## Test plan

- Run `bun run type-check` and `bun test packages` to verify compilation and test baseline.

## Done criteria

- [ ] `QueryConfigVariant` type definition and exports completely removed.
- [ ] `variants` property removed from all `QueryConfig` related interfaces.
- [ ] The dashboard application typechecks successfully.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If any typescript configuration fails compiling due to unresolved imports of `QueryConfigVariant`.

## Maintenance notes

- None.
