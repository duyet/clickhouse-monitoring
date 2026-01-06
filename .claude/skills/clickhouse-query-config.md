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

### Pattern 2: Version-Aware Queries with `since`

**IMPORTANT:** The `variants` field is **DEPRECATED**. Use `sql: VersionedSql[]` with `since` instead.

When columns differ across versions, use an array of `VersionedSql` objects ordered oldest → newest:

```typescript
export const myConfig: QueryConfig = {
  name: 'my-query',
  // Version-aware queries (oldest → newest)
  sql: [
    {
      since: '19.1',
      description: 'Base query - new_col not available',
      sql: `
        SELECT col1, col2, 0 AS new_col
        FROM system.table
      `,
    },
    {
      since: '24.1',
      description: 'Includes new_col column',
      sql: `
        SELECT col1, col2, new_col
        FROM system.table
      `,
    },
  ],
  columns: ['col1', 'col2', 'new_col'],
  // ... rest of config
}
```

## Critical Rule: Column Consistency

**ALL version queries MUST output the SAME columns as defined in `columns[]`.**

When a column isn't available in older versions, use placeholder values:

```typescript
sql: [
  {
    since: '19.1',
    sql: `
      SELECT
        col1,
        col2,
        0 AS unavailable_number_col,      -- Placeholder for numeric column
        '-' AS unavailable_string_col,    -- Placeholder for string column
        NULL AS unavailable_nullable_col  -- Placeholder for nullable column
      FROM system.table
    `,
  },
  {
    since: '24.1',
    sql: `
      SELECT
        col1,
        col2,
        unavailable_number_col,           -- Now available
        unavailable_string_col,           -- Now available
        unavailable_nullable_col          -- Now available
      FROM system.table
    `,
  },
],
columns: ['col1', 'col2', 'unavailable_number_col', 'unavailable_string_col', 'unavailable_nullable_col'],
```

**Why this matters:**
- The `columns[]` array defines what the UI expects to render
- If a query returns fewer columns, the table will break or show undefined values
- Placeholder values ensure consistent rendering across all ClickHouse versions

## Version Selection Logic

The system picks the **highest `since` version that is ≤ current ClickHouse version**:

```typescript
sql: [
  { since: '23.8', sql: 'SELECT col1 FROM system.table' },
  { since: '24.1', sql: 'SELECT col1, col2 FROM system.table' },
  { since: '25.6', sql: 'SELECT col1, col2, col3 FROM system.table' },
]
// For CH v24.5 → selects '24.1' query (highest <= 24.5)
// For CH v25.8 → selects '25.6' query (highest <= 25.8)
// For CH v23.5 → selects '23.8' query (fallback to oldest)
```

## BackgroundBar Column Format Requirements

The `ColumnFormat.BackgroundBar` displays a colored bar proportional to the value. It requires **3 columns** in your SQL query:

| Required Column | Naming Convention | Purpose |
|-----------------|-------------------|---------|
| Base value | `{column}` | Original numeric value (e.g., `rows`, `data_compressed_bytes`) |
| Display value | `readable_{column}` | Formatted display value (e.g., `formatReadableSize(data_compressed_bytes)`) |
| Percentage | `pct_{column}` | Value as % of max (0-100), used for bar width |

### How BackgroundBar Resolves Columns

```typescript
// In background-bar-format.tsx:
const colName = columnName.replace('readable_', '')  // 'readable_rows' → 'rows'
const pctColName = `pct_${colName}`                  // → 'pct_rows'
const pct = row.original[pctColName]                 // bar width
const orgValue = row.original[colName]              // tooltip value
```

### SQL Pattern for BackgroundBar

```sql
SELECT
  -- Base value (for sorting and tooltip)
  rows,
  -- Display value (what user sees in cell)
  formatReadableQuantity(rows) AS readable_rows,
  -- Percentage (for bar width, 0-100)
  round(rows * 100.0 / nullIf(max(rows) OVER (), 0), 2) AS pct_rows
FROM system.table
```

### Complete BackgroundBar Example

```typescript
export const myConfig: QueryConfig = {
  name: 'my-query',
  sql: `
    WITH base_data AS (
      SELECT *, round(col_a / nullIf(col_b, 0), 2) AS ratio
      FROM system.table
    )
    SELECT
      name,
      -- BackgroundBar for rows
      rows,
      formatReadableQuantity(rows) AS readable_rows,
      round(rows * 100.0 / nullIf(max(rows) OVER (), 0), 2) AS pct_rows,
      -- BackgroundBar for bytes
      bytes,
      formatReadableSize(bytes) AS readable_bytes,
      round(bytes * 100.0 / nullIf(max(bytes) OVER (), 0), 2) AS pct_bytes,
      -- BackgroundBar for computed ratio
      ratio,
      round(ratio * 100.0 / nullIf(max(ratio) OVER (), 0), 2) AS pct_ratio
    FROM base_data
  `,
  columns: ['name', 'readable_rows', 'readable_bytes', 'ratio'],
  columnFormats: {
    readable_rows: ColumnFormat.BackgroundBar,
    readable_bytes: ColumnFormat.BackgroundBar,
    ratio: ColumnFormat.BackgroundBar,
  },
}
```

**Notes:**
- Use `nullIf(..., 0)` to avoid division by zero
- Use `max(...) OVER ()` window function to get max across all rows
- For computed columns (like ratio), use a CTE to calculate first, then add pct_ in outer SELECT

### Quick Reference: "Format BackgroundBar for X, Y, Z"

When user requests: **"format background bar for: rows, compressed, uncompressed, compression ratio, primary key size"**

**Action Required:** For EACH column, add these 3 SQL columns:

| User Says | Base Column | Display Column | Percentage Column |
|-----------|-------------|----------------|-------------------|
| rows | `rows` | `formatReadableQuantity(rows) AS readable_rows` | `round(rows * 100.0 / nullIf(max(rows) OVER (), 0), 2) AS pct_rows` |
| compressed | `data_compressed_bytes` | `formatReadableSize(data_compressed_bytes) AS readable_compressed` | `round(data_compressed_bytes * 100.0 / nullIf(max(data_compressed_bytes) OVER (), 0), 2) AS pct_compressed` |
| uncompressed | `data_uncompressed_bytes` | `formatReadableSize(data_uncompressed_bytes) AS readable_uncompressed` | `round(data_uncompressed_bytes * 100.0 / nullIf(max(data_uncompressed_bytes) OVER (), 0), 2) AS pct_uncompressed` |
| compression ratio | `compression_ratio` (computed in CTE) | Already numeric, no readable_ needed | `round(compression_ratio * 100.0 / nullIf(max(compression_ratio) OVER (), 0), 2) AS pct_compression_ratio` |
| primary key size | `primary_key_bytes_in_memory` | `formatReadableSize(primary_key_bytes_in_memory) AS readable_primary_key_size` | `round(primary_key_bytes_in_memory * 100.0 / nullIf(max(primary_key_bytes_in_memory) OVER (), 0), 2) AS pct_primary_key_size` |

**Then in columnFormats:**
```typescript
columnFormats: {
  readable_rows: ColumnFormat.BackgroundBar,
  readable_compressed: ColumnFormat.BackgroundBar,
  readable_uncompressed: ColumnFormat.BackgroundBar,
  compression_ratio: ColumnFormat.BackgroundBar,
  readable_primary_key_size: ColumnFormat.BackgroundBar,
}
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

After adding version-aware queries:

- [ ] All queries work on their target CH version range
- [ ] **ALL queries output the SAME columns as `columns[]`** (critical!)
- [ ] Placeholder values used for unavailable columns in older versions
- [ ] Column names are correct (check docs - e.g., `marks` not `marks_count`)
- [ ] No syntax errors in SQL
- [ ] Run `bun tsc --noEmit` to verify type safety

## Common Mistakes to Avoid

1. **Don't assume column exists** - Always check `tables/{table}.md`
2. **Don't use deprecated `variants`** - Use `sql: VersionedSql[]` with `since` instead
3. **Don't forget column consistency** - ALL queries must output SAME columns as `columns[]`
4. **Don't use wrong column names** - e.g., `marks` not `marks_count` in system.parts
5. **Test on multiple versions** - Verify queries work on target versions

## Example: Full Implementation

```typescript
// lib/query-config/queries/running-queries.ts
import { ColumnFormat, type QueryConfig } from '@/types/query-config'

export const runningQueriesConfig: QueryConfig = {
  name: 'running-queries',
  description: 'Currently running queries',

  // Version-aware queries (oldest → newest)
  sql: [
    {
      since: '19.1',
      description: 'Base query - peak_threads_usage not available',
      sql: `
        SELECT
          query,
          user,
          elapsed,
          read_rows,
          0 AS peak_threads_usage,  -- Placeholder for older versions
          formatReadableSize(memory_usage) as readable_memory
        FROM system.processes
        WHERE is_cancelled = 0
        ORDER BY elapsed DESC
      `,
    },
    {
      since: '24.1',
      description: 'Includes peak_threads_usage column',
      sql: `
        SELECT
          query,
          user,
          elapsed,
          read_rows,
          peak_threads_usage,  -- Now available
          formatReadableSize(memory_usage) as readable_memory
        FROM system.processes
        WHERE is_cancelled = 0
        ORDER BY elapsed DESC
      `,
    },
  ],

  // columns[] MUST match what ALL version queries output
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
