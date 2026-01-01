---
name: clickhouse-query-config
description: Build and maintain version-aware ClickHouse query configurations. Use when adding/modifying queries in lib/query-config/ or fixing query failures on specific CH versions.
---

# ClickHouse Query Config Maintenance Skill

## When This Skill Applies

- Adding new query configurations
- Modifying existing queries in `lib/query-config/`
- Debugging query failures on specific ClickHouse versions
- Adding version-specific query variants

## Required Context Loading

Before modifying ANY query config, you MUST read these files:

1. **Table Schema**: `docs/clickhouse-schemas/tables/{table}.md`
   - Contains full schema history for the system table
   - Shows column availability by version

2. **Version Changes**: `docs/clickhouse-schemas/v{version}.md`
   - Breaking changes in that version
   - New/removed columns

3. **Existing Patterns**: `lib/query-config/` directory
   - Follow existing code patterns

## Schema Lookup Workflow

### Step 1: Identify Target Tables

Extract table names from your SQL query:
- `FROM system.processes` → read `docs/clickhouse-schemas/tables/processes.md`
- `FROM system.query_log` → read `docs/clickhouse-schemas/tables/query_log.md`
- `JOIN system.parts` → also read `docs/clickhouse-schemas/tables/parts.md`

### Step 2: Check Column Availability

In `tables/{table}.md`, find the **Version Compatibility Matrix**:

| Column | 23.1 | 23.8 | 24.1 | 24.8 | 25.1 |
|--------|------|------|------|------|------|
| query | Yes | Yes | Yes | Yes | Yes |
| query_cache_usage | - | - | Yes | Yes | Yes |
| peak_threads_usage | - | - | Yes | Yes | Yes |

### Step 3: Determine If Variants Needed

If a column you need is NOT available in all supported versions, you MUST add a variant.

## Query Config Patterns

### Pattern 1: Basic Config (No Version Differences)

When all columns exist across all versions:

```typescript
export const myConfig: QueryConfig = {
  name: 'my-query',
  sql: `
    SELECT col1, col2, col3
    FROM system.table
    WHERE condition = 1
  `,
  columns: ['col1', 'col2', 'col3'],
  columnFormats: {
    col1: ColumnFormat.Code,
  },
}
```

### Pattern 2: Config with Version Variants

When columns differ across versions:

```typescript
export const myConfig: QueryConfig = {
  name: 'my-query',
  // Default query (for LATEST versions)
  sql: `
    SELECT col1, col2, new_col
    FROM system.table
  `,
  // Variants for older versions (evaluated IN ORDER - first match wins)
  variants: [
    {
      versions: '<24.1',
      description: 'Pre-24.1: new_col not available',
      sql: `
        SELECT col1, col2
        FROM system.table
      `,
    },
  ],
  columns: ['col1', 'col2', 'new_col'],
  // ... rest of config
}
```

### Pattern 3: Multiple Version Ranges

```typescript
variants: [
  {
    versions: '<23.8',
    description: 'Pre-23.8: legacy schema',
    sql: `SELECT legacy_col FROM system.table`,
  },
  {
    versions: '>=23.8 <24.1',
    description: '23.8-24.0: intermediate schema',
    sql: `SELECT intermediate_col FROM system.table`,
  },
],
// Default sql is for >=24.1
sql: `SELECT new_col FROM system.table`,
```

## Semver Range Syntax

| Pattern | Meaning | Example |
|---------|---------|---------|
| `<24.1` | Below 24.1.0 | 23.x, 24.0.x |
| `>=24.1` | 24.1.0 and above | 24.1+, 25.x |
| `>=23.8 <24.1` | Range inclusive/exclusive | 23.8.x to 24.0.x |
| `^24.1` | Compatible with 24.x | 24.1 to 24.x |
| `~24.1.2` | Patch-compatible | 24.1.2 to 24.1.x |

## Common Patterns

### Optional Column with Fallback

When a column may or may not exist:

```sql
SELECT
  col1,
  -- Use 0 as default if column doesn't exist in this version
  if(has(columns, 'new_col'), new_col, 0) as new_col
FROM system.table
```

### Version-Specific Aggregations

```typescript
variants: [
  {
    versions: '<24.1',
    sql: `
      SELECT
        count() as query_count
      FROM system.query_log
    `,
  },
],
sql: `
  SELECT
    count() as query_count,
    query_cache_usage  -- Only available in 24.1+
  FROM system.query_log
  GROUP BY query_cache_usage
`,
```

## File Locations Reference

| Purpose | Path |
|---------|------|
| Table schemas | `docs/clickhouse-schemas/tables/*.md` |
| Version changes | `docs/clickhouse-schemas/v*.md` |
| Query configs | `lib/query-config/**/*.ts` |
| Chart queries | `lib/api/charts/*.ts` |
| Version utilities | `lib/clickhouse-version.ts` |
| QueryConfig type | `types/query-config.ts` |

## Testing Checklist

After adding variants:

- [ ] Default query works on latest CH version
- [ ] Each variant query works on its target version range
- [ ] Column references match available columns per version
- [ ] No syntax errors in SQL
- [ ] Run `bun tsc --noEmit` to verify type safety

## Common Mistakes to Avoid

1. **Don't assume column exists** - Always check `tables/{table}.md`
2. **Don't forget variants** - If column added in v24.1, add variant for <24.1
3. **Don't hardcode versions** - Use semver ranges for flexibility
4. **Test on multiple versions** - Verify queries work on target versions

## Example: Full Implementation

```typescript
// lib/query-config/queries/running-queries.ts
import { ColumnFormat, type QueryConfig } from '@/types/query-config'

export const runningQueriesConfig: QueryConfig = {
  name: 'running-queries',
  description: 'Currently running queries',

  // Default query for ClickHouse 24.1+
  sql: `
    SELECT
      query,
      user,
      elapsed,
      read_rows,
      peak_threads_usage,  -- Added in 24.1
      formatReadableSize(memory_usage) as readable_memory
    FROM system.processes
    WHERE is_cancelled = 0
    ORDER BY elapsed DESC
  `,

  variants: [
    {
      versions: '<24.1',
      description: 'Pre-24.1: peak_threads_usage not available',
      sql: `
        SELECT
          query,
          user,
          elapsed,
          read_rows,
          formatReadableSize(memory_usage) as readable_memory
        FROM system.processes
        WHERE is_cancelled = 0
        ORDER BY elapsed DESC
      `,
    },
  ],

  columns: [
    'query',
    'user',
    'elapsed',
    'read_rows',
    'peak_threads_usage',
    'readable_memory',
  ],

  columnFormats: {
    query: [ColumnFormat.CodeDialog, { max_truncate: 80 }],
    elapsed: ColumnFormat.Duration,
    readable_memory: ColumnFormat.BackgroundBar,
  },
}
```
