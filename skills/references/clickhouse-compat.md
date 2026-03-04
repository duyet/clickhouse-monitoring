# ClickHouse Compatibility Guide

Patterns for writing version-aware queries that work across different ClickHouse versions.

## Overview

ClickHouse system tables change between versions. Columns are added, removed, or renamed. The dashboard uses **version-aware queries** to handle these changes gracefully.

## VersionedSql Pattern

### Basic Syntax

```typescript
sql: [
  { since: '23.8', sql: 'SELECT col1 FROM system.table' },
  { since: '24.1', sql: 'SELECT col1, col2 FROM system.table' },
  { since: '24.3', sql: 'SELECT col1, col2, col3 FROM system.table' },
]
```

**Rules:**
- Queries are ordered **chronologically** (oldest → newest)
- System selects the **highest `since` version ≤ current version**
- For CH v24.5 → selects `24.3` query (highest ≤ 24.5)
- For CH v23.5 → selects `23.8` query (fallback to oldest)

### Example: Adding a New Column

In ClickHouse 24.3, `system.query_log` added a new column `disk_usage`.

```typescript
export const queryConfig: QueryConfig = {
  name: 'query-with-disk',
  sql: [
    {
      since: '23.8',
      sql: `
        SELECT
          query_id,
          user,
          query
        FROM system.query_log
      `,
      columns: ['query_id', 'user', 'query'],
    },
    {
      since: '24.3',
      sql: `
        SELECT
          query_id,
          user,
          query,
          disk_usage
        FROM system.query_log
      `,
      columns: ['query_id', 'user', 'query', 'disk_usage'],
    },
  ],
  columns: ['query_id', 'user', 'query', 'disk_usage'],
}
```

### Example: Type Changes

Some columns changed from `Int8` to `Enum` between versions.

```typescript
// system.part_log.event_type changed from Int8 to Enum in v24.3
export const mergesConfig: QueryConfig = {
  name: 'merges',
  sql: `
    SELECT *
    FROM merge('system', '^part_log')
    WHERE toInt8(event_type) = 2  -- MergeParts (works for both Int8 and Enum)
      AND toInt8(merge_reason) = 1  -- RegularMerge
  `,
  columns: ['event_time', 'event_type', 'merge_reason', 'database', 'table'],
}
```

**Known event_type values:**
- 1 = NewPart
- 2 = MergeParts
- 3 = DownloadPart
- 4 = RemovePart
- 5 = MutatePart
- 6 = MovePart

**Known merge_reason values:**
- 1 = RegularMerge
- 2 = TTLDeleteMerge
- 3 = TTLRecompressMerge

## Schema Documentation

### Available Schemas

The project includes ClickHouse schema documentation per version:

```
docs/clickhouse-schemas/
├── v23.8.md
├── v24.1.md
├── v24.3.md
├── v24.5.md
├── v24.6.md
├── v24.7.md
├── v24.8.md
├── v24.9.md
├── v24.10.md
├── v24.11.md
├── v24.12.md
└── tables/
    ├── query_log.md
    ├── part_log.md
    ├── processes.md
    └── ...
```

### Table Documentation

Each table has a markdown file documenting:
- Table purpose and requirements
- Column availability by version
- Query examples

**Example: `tables/query_log.md`**
```markdown
# system.query_log

## Purpose
Logs all queries executed on the server.

## Requirements
Must be enabled in ClickHouse config:

```xml
<query_log>
    <database>system</database>
    <table>query_log</table>
    <enabled>1</enabled>
</query_log>
```

## Columns

| Column | Since | Type | Description |
|--------|-------|------|-------------|
| event_date | all | Date | Event date |
| event_time | all | DateTime | Event time |
| query_id | all | String | Query ID |
| query | all | String | Query text |
| disk_usage | 24.3 | UInt64 | Disk usage |
```

### Regenerating Schema Docs

To regenerate schema documentation after adding a new version:

```bash
bun run scripts/build-ch-schema-docs.ts
```

## Optional Tables

Some tables may not exist depending on ClickHouse configuration:

### Optional Tables List

| Table | When Available |
|-------|----------------|
| `system.backup_log` | Only when backup is configured |
| `system.error_log` | Requires error logging configuration |
| `system.zookeeper` | Only with ZooKeeper/Keeper enabled |
| `system.monitoring_events` | Custom table created by monitoring app |

### Marking Queries as Optional

```typescript
export const backupsConfig: QueryConfig = {
  name: 'backups',
  optional: true,  // Don't error if table doesn't exist
  tableCheck: 'system.backup_log',  // Explicit table to check
  sql: 'SELECT * FROM system.backup_log',
  columns: ['name', 'status', 'start_time'],
  suggestion: `
    Enable backup logging to see backup history.

    See: https://clickhouse.com/docs/en/operations/backup
  `,
}
```

### Automatic Table Detection

If `tableCheck` is not provided, the system automatically extracts table names from the SQL query.

**Handles:**
- Direct table access: `SELECT * FROM system.tables`
- JOINs: `FROM system.tables AS t JOIN system.columns AS c`
- Subqueries: `WHERE database IN (SELECT database FROM system.databases)`
- CTEs: `WITH tables AS (SELECT * FROM system.tables)`
- EXISTS clauses: `WHERE EXISTS (SELECT 1 FROM system.parts)`

### Graceful Error Handling

When an optional table doesn't exist:

```json
{
  "success": false,
  "error": {
    "type": "table_not_found",
    "message": "Table system.backup_log does not exist"
  },
  "metadata": {
    "status": "table_not_found",
    "statusMessage": "Backup logging is not configured",
    "missingTables": ["system.backup_log"]
  }
}
```

## BackgroundBar Column Format

For charts and tables with background progress bars, provide **three SQL columns**:

### Pattern

```typescript
sql: `
  SELECT
    rows,                                              -- Base value
    formatReadableQuantity(rows) AS readable_rows,     -- Display text
    round(rows * 100.0 / max(rows) OVER (), 2) AS pct_rows  -- Percentage
  FROM system.parts
`,
columns: [
  'rows',           -- Base column (number)
  'readable_rows',  -- Readable format (string)
  'pct_rows',       -- Percentage (0-100)
]
```

### Naming Convention

```
{column}          → Base value (number)
readable_{column} → Human-readable format
pct_{column}      → Percentage for progress bar
```

### Examples

**Disk usage:**
```sql
disk_size,
formatReadableSize(disk_size) AS readable_disk_size,
round(disk_size * 100.0 / max(disk_size) OVER (), 2) AS pct_disk_size
```

**Memory usage:**
```sql
memory_usage,
formatReadableSize(memory_usage) AS readable_memory_usage,
round(memory_usage * 100.0 / max(memory_usage) OVER (), 2) AS pct_memory_usage
```

**Elapsed time:**
```sql
elapsed,
formatReadableTimeDelta(elapsed) AS readable_elapsed,
round(elapsed * 100.0 / max(elapsed) OVER (), 2) AS pct_elapsed
```

### Using in Column Formats

```typescript
columnFormats: {
  readable_rows: ColumnFormat.BackgroundBar,  // Uses pct_rows for bar
}
```

## Cross-Version Cluster Queries

### merge() Function

For cluster-wide queries, use `merge('system', '^table_name')`:

```typescript
sql: `
  SELECT *
  FROM merge('system', '^part_log')
  WHERE toInt8(event_type) = 2
`
```

**This aggregates data from:**
- `system.part_log` (local)
- `system.part_log_1`, `system.part_log_2`, etc. (replicated)

### Schema Compatibility Issues

When using `merge()` across shards with different ClickHouse versions:

```typescript
// Bad: Fails when shards have different schemas
sql: `
  SELECT event_type
  FROM merge('system', '^part_log')
  WHERE event_type = 2  -- Fails if event_type is Enum on some shards
`

// Good: Use toInt8() for compatibility
sql: `
  SELECT event_type
  FROM merge('system', '^part_log')
  WHERE toInt8(event_type) = 2  -- Works for both Int8 and Enum
`
```

## Version Detection

The dashboard automatically detects ClickHouse version on first connection:

```typescript
// From lib/clickhouse.ts
const version = await client.query({
  query: 'SELECT version() AS v',
  format: 'JSONEachRow',
})
// Returns: "24.3.1.1"
```

This version is cached and used to select appropriate queries from `VersionedSql[]`.

## Best Practices

### 1. Always Check Schema Docs

Before writing queries, check `docs/clickhouse-schemas/tables/{table}.md` for:
- Column availability by version
- Type changes
- Query requirements

### 2. Use toInt8() for Enums

When filtering on columns that might be Enum or Int8:
```sql
WHERE toInt8(event_type) = 2
```

### 3. Provide Helpful Suggestions

For optional tables, include setup instructions:
```typescript
suggestion: `
  Enable query logging:

  SET log_queries = 1;
  SET log_queries_min_type = 'QueryFinish';

  See: https://clickhouse.com/docs/en/operations/query-log
`
```

### 4. Test Against Multiple Versions

Test queries against:
- Oldest supported version (23.8)
- Latest stable version
- Development version

### 5. Document Breaking Changes

When adding a new `VersionedSql`, document what changed:
```typescript
{
  since: '24.3',
  description: 'Added disk_usage column',
  sql: 'SELECT query_id, disk_usage FROM system.query_log',
}
```

## Common Patterns

### New Column Added

```typescript
sql: [
  { since: '23.8', sql: 'SELECT col1 FROM t' },
  { since: '24.3', sql: 'SELECT col1, col2 FROM t' },  // col2 added
]
```

### Column Type Changed

```typescript
sql: `
  SELECT toInt8(event_type) AS type  -- Works for Int8 and Enum
  FROM system.part_log
`
```

### Table Renamed/Moved

```typescript
sql: [
  { since: '23.8', sql: 'SELECT * FROM system.old_table' },
  { since: '24.1', sql: 'SELECT * FROM system.new_table' },
]
```

### Query Pattern Changed

```typescript
sql: [
  {
    since: '23.8',
    sql: 'SELECT count() FROM system.metrics WHERE name = "Query"',
  },
  {
    since: '24.3',
    sql: 'SELECT sum(value) FROM system.metrics WHERE name LIKE "%Query%"',
  },
]
```

## See Also

- [API Endpoints Reference](api-endpoints.md) - Using queries in API
- [Development Guide](development.md) - Adding query configs
- [Schema Documentation](../docs/clickhouse-schemas/) - Complete column reference
