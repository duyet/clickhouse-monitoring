# Plan 021: SQL Validation Bypass Allow RENAME/REPLACE Schema Mutations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 29d5f8ec..HEAD -- packages/sql-builder/src/sql-validator.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: security
- **Planned at**: commit `29d5f8ec`, 2026-06-14
- **State**: TODO

## Why this matters

The dashboard and MCP API endpoints accept raw SQL query inputs from the client. To prevent injection or unauthorized modifications, a `validateSqlQuery` utility is used to block destructive keywords. 

Currently, `DANGEROUS_KEYWORDS` checks block `DROP`, `DELETE`, `INSERT`, `UPDATE`, `ALTER`, `CREATE`, and `TRUNCATE`. However, it omits ClickHouse-specific table mutations like `RENAME` (e.g. `RENAME TABLE`) and `REPLACE` (e.g. `REPLACE TABLE`), which would allow a client to rename or replace tables and break database integrity.

We will add `RENAME` and `REPLACE` to the dangerous keywords regex pattern, and update the unit test suite to verify they are blocked.

## Current state

In `packages/sql-builder/src/sql-validator.ts`:
```typescript
export const SQL_PATTERNS = {
  /**
   * Dangerous SQL keywords that modify data or schema
   */
  DANGEROUS_KEYWORDS: /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE)\b/i,
  ...
  /**
   * Chained dangerous statements
   */
  CHAINED_DANGEROUS: /;\s*(DROP|DELETE|INSERT|UPDATE)/i,
}
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Typecheck | `bun run type-check` | exit 0, no errors |
| Test package| `bun run test:packages` | exit 0, all tests pass |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope**:
- `packages/sql-builder/src/sql-validator.ts`
- `packages/sql-builder/src/__tests__/sql-validator.test.ts`

**Out of scope**:
- Other packages or query files.

## Git workflow

- Branch: `advisor/021-sql-validation-rename-replace`
- Commit message: `security: add RENAME and REPLACE to dangerous SQL keywords blocklist`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Update DANGEROUS_KEYWORDS and CHAINED_DANGEROUS patterns

Open [sql-validator.ts](file:///Users/duet/project/clickhouse-monitor/packages/sql-builder/src/sql-validator.ts).
1. Modify `DANGEROUS_KEYWORDS` to include `RENAME` and `REPLACE`:
```typescript
  DANGEROUS_KEYWORDS: /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|RENAME|REPLACE)\b/i,
```
2. Modify `CHAINED_DANGEROUS` to match all dangerous keywords:
```typescript
  CHAINED_DANGEROUS: /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|RENAME|REPLACE)/i,
```

### Step 2: Add validation tests for RENAME and REPLACE

Open [sql-validator.test.ts](file:///Users/duet/project/clickhouse-monitor/packages/sql-builder/src/__tests__/sql-validator.test.ts).
1. Add tests in the test suite asserting that `validateSqlQuery` throws/rejects queries containing `RENAME TABLE`, `REPLACE TABLE`, or chained mutations using these keywords.
   * Example:
```typescript
  it('rejects RENAME and REPLACE queries', () => {
    expect(() => validateSqlQuery('RENAME TABLE old TO new')).toThrow()
    expect(() => validateSqlQuery('REPLACE TABLE t1 (id UInt32)')).toThrow()
    expect(() => validateSqlQuery('SELECT * FROM my_table; RENAME TABLE old TO new')).toThrow()
  })
```

**Verify**: Run `bun run test:packages` to verify that the tests are built and run successfully.

## Test plan

- Run `bun run test:packages` to ensure the validator and other tests pass.

## Done criteria

- [ ] `RENAME` and `REPLACE` added to dangerous keywords regex pattern in `sql-validator.ts`.
- [ ] Unit tests verify that `RENAME` and `REPLACE` queries are rejected.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If valid SELECT queries containing the words "rename" or "replace" as column aliases or table names are overly restricted (e.g. `SELECT field AS rename_value`). Check that the boundary markers `\b` protect these occurrences.
