# QueryConfigBuilder - Type-Safe Configuration Builder

A fluent builder pattern implementation for creating type-safe `QueryConfig` objects. Provides compile-time validation of column references, format options, and complete method chaining support.

## Overview

`QueryConfigBuilder` is a strongly-typed helper class that makes it easier to construct `QueryConfig` objects with full IDE autocomplete and TypeScript validation. It replaces manual object literals with a chainable, self-documenting API.

## Features

- **Type-Safe Column References**: Column names are validated at compile-time against the Row type
- **Format Options Validation**: Format options are type-checked based on the selected format
- **Method Chaining**: All methods return `this` for fluent interface
- **Compile-Time Safety**: Catch errors early with full TypeScript support
- **IDE Autocomplete**: Full autocomplete support for all methods and parameters

## Quick Start

### Basic Usage

```typescript
import { defineQuery } from '@/lib/query-config-builder'
import { ColumnFormat } from '@/types/column-format'

// Define your row type
type ClusterRow = {
  cluster: string
  shard_count: number
  replica_count: number
  replica_status: string
}

// Create config using the builder
export const queryConfig = defineQuery<ClusterRow>()
  .name('clusters')
  .description('Cluster information')
  .sql('SELECT cluster, countDistinct(shard_num) as shard_count FROM system.clusters')
  .columns('cluster', 'shard_count', 'replica_count', 'replica_status')
  .link('cluster', '/[ctx.hostId]/clusters/[cluster]')
  .build()
```

## API Reference

### Factory Function

#### `defineQuery<TRow>()`

Factory function that creates a new `QueryConfigBuilder` instance. Alias for `QueryConfigBuilder.create()`.

```typescript
const builder = defineQuery<ClusterRow>()
```

### Required Methods

These methods must be called before `build()`:

#### `.name(name: string): this`

Set the unique identifier for the query configuration.

```typescript
.name('clusters')
```

#### `.sql(query: string): this`

Set the ClickHouse SQL query.

```typescript
.sql('SELECT cluster, shard_count FROM system.clusters')
```

#### `.columns(...cols: RowKeys<TRow>[]): this`

Define which columns to display. Column names must exist in the Row type.

```typescript
.columns('cluster', 'shard_count', 'replica_count')
```

### Configuration Methods

#### `.description(desc: string): this`

Set human-readable description for UI display.

```typescript
.description('Cluster information and statistics')
```

#### `.format<K extends RowKeys<TRow>>(column: K, format: ColumnFormat, options?: any): this`

Add column format with type-safe options. Format options are validated based on the format type.

```typescript
.format('query', ColumnFormat.CodeDialog, {
  max_truncate: 100,
  hide_query_comment: true
})
```

#### `.link<K extends RowKeys<TRow>>(column: K, href: string, options?: { external?: boolean }): this`

Convenience method to add a Link format. The href can include placeholders like `[column]` or `[ctx.hostId]`.

```typescript
.link('cluster', '/[ctx.hostId]/clusters/[cluster]')
.link('docs', 'https://docs.example.com', { external: true })
```

#### `.actions<K extends RowKeys<TRow>>(column: K, actions: Action[]): this`

Convenience method to add actions to a column. Actions are performed on individual rows.

```typescript
.actions('query_id', ['kill-query', 'explain-query'])
```

#### `.icon<K extends RowKeys<TRow>>(column: K, icon: Icon): this`

Add an icon to a column header.

```typescript
import { CalendarIcon } from 'lucide-react'

.icon('event_time', CalendarIcon)
```

#### `.sortBy<K extends RowKeys<TRow>>(column: K, fn: CustomSortingFnNames | BuiltInSortingFn): this`

Add a custom sorting function for a column.

```typescript
.sortBy('readable_avg_part_size', 'sort_column_using_actual_value')
```

#### `.charts(...charts: any[]): this`

Add related charts to display with this query.

```typescript
.charts('disk-size', 'memory-usage', 'query-performance')
```

#### `.optional(tableCheck?: string | string[]): this`

Mark this query as optional (targets tables that may not exist). Optionally specify which tables to validate.

```typescript
.optional()
.optional('system.backup_log')
.optional(['system.error_log', 'system.zookeeper'])
```

#### `.defaultParams(params: Record<string, string | number | boolean>): this`

Set default parameters for SQL placeholders.

```typescript
.defaultParams({ database: 'default', limit: 1000 })
```

#### `.settings(settings: ClickHouseSettings): this`

Set ClickHouse-specific query settings.

```typescript
.settings({
  readonly: 1,
  max_rows_to_read: 1000000,
  max_execution_time: 30
})
```

#### `.docs(url: string): this`

Add documentation URL for error messages.

```typescript
.docs('https://clickhouse.com/docs/en/operations/backup')
```

#### `.disableSqlValidation(disabled?: boolean): this`

Disable SQL validation in tests. Defaults to `true` when called without arguments.

```typescript
.disableSqlValidation()      // Sets to true
.disableSqlValidation(true)  // Sets to true
.disableSqlValidation(false) // Sets to false
```

### Build Method

#### `.build(): QueryConfig`

Build and return the final `QueryConfig` object. Validates that all required fields are set.

```typescript
const config = builder.build()
```

**Throws:**
- `Error` if `name` is not set
- `Error` if `sql` is not set
- `Error` if `columns` are not set or empty

## Examples

### Simple Configuration

```typescript
export const queryConfig = defineQuery<{ cluster: string }>()
  .name('clusters')
  .sql('SELECT cluster FROM system.clusters')
  .columns('cluster')
  .build()
```

### With Links and Actions

```typescript
type QueryRow = {
  query_id: string
  query: string
  user: string
}

export const queryConfig = defineQuery<QueryRow>()
  .name('processes')
  .sql('SELECT query_id, query, user FROM system.processes')
  .columns('query_id', 'query', 'user')
  .link('query', '/query/[query_id]')
  .actions('query_id', ['kill-query', 'explain-query'])
  .build()
```

### With Sorting and Formatting

```typescript
type TableRow = {
  database: string
  table: string
  bytes: number
  rows: number
}

export const queryConfig = defineQuery<TableRow>()
  .name('tables')
  .sql('SELECT database, table, bytes, rows FROM system.tables')
  .columns('database', 'table', 'bytes', 'rows')
  .format('bytes', ColumnFormat.Number)
  .format('rows', ColumnFormat.Number)
  .sortBy('bytes', 'sort_column_using_actual_value')
  .sortBy('rows', 'sort_column_using_actual_value')
  .build()
```

### Complex Configuration

```typescript
type BackupRow = {
  backup_name: string
  backup_path: string
  status: string
  start_time: string
  finish_time: string
  size_bytes: number
  error: string
}

export const queryConfig = defineQuery<BackupRow>()
  .name('backups')
  .description('Backup status and history')
  .sql('SELECT * FROM system.backup_log WHERE 1=1')
  .columns('backup_name', 'backup_path', 'status', 'start_time', 'finish_time', 'size_bytes', 'error')
  .link('backup_path', '/backups/[backup_name]')
  .format('status', ColumnFormat.ColoredBadge, { color: 'success' })
  .format('error', ColumnFormat.CodeDialog, { json: false })
  .sortBy('start_time', 'datetime')
  .sortBy('size_bytes', 'sort_column_using_actual_value')
  .charts('backup-size', 'backup-duration')
  .optional('system.backup_log')
  .defaultParams({ limit: 100 })
  .settings({ readonly: 1 })
  .docs('https://clickhouse.com/docs/en/operations/backup')
  .build()
```

## Type Safety

The builder ensures type safety at compile time:

```typescript
type Row = { cluster: string; shard_count: number }

// ✅ Valid - column exists in Row
defineQuery<Row>().columns('cluster', 'shard_count')

// ❌ TypeScript error - column doesn't exist
defineQuery<Row>().columns('cluster', 'typo_column')

// ✅ Valid - format is correct
defineQuery<Row>()
  .format('cluster', ColumnFormat.Link, { href: '/clusters/[cluster]' })

// ❌ TypeScript error - invalid format option
defineQuery<Row>()
  .format('cluster', ColumnFormat.Link, { invalid_option: true })
```

## Comparison with Object Literals

### Before (Manual Object)

```typescript
const queryConfig: QueryConfig = {
  name: 'clusters',
  sql: 'SELECT cluster FROM system.clusters',
  columns: ['cluster', 'shard_count', 'typo_column'], // No error!
  columnFormats: {
    cluster: [ColumnFormat.Link, { href: '/clusters/[cluster]' }],
    typo: ColumnFormat.Badge, // No error!
  }
}
```

### After (Builder Pattern)

```typescript
// ✅ Compile-time validation
export const queryConfig = defineQuery<ClusterRow>()
  .name('clusters')
  .sql('SELECT cluster FROM system.clusters')
  .columns('cluster', 'shard_count') // TypeScript validates columns exist
  .link('cluster', '/clusters/[cluster]') // Options are type-checked
  .build()
```

## Migration Guide

### Step 1: Define Row Type

Identify the columns returned by your query:

```typescript
// Before: No type definition
export const queryConfig: QueryConfig = {
  columns: ['cluster', 'shard_count'],
  // ...
}

// After: Explicit type
type ClusterRow = {
  cluster: string
  shard_count: number
}

export const queryConfig = defineQuery<ClusterRow>()
  .columns('cluster', 'shard_count')
  // ...
  .build()
```

### Step 2: Replace Object Literal

Convert your object literal to builder method calls:

```typescript
// Before
export const queryConfig: QueryConfig = {
  name: 'clusters',
  description: 'Cluster information',
  sql: 'SELECT ...',
  columns: ['cluster', 'shard_count'],
  columnFormats: {
    cluster: [ColumnFormat.Link, { href: '/clusters/[cluster]' }],
  },
}

// After
export const queryConfig = defineQuery<ClusterRow>()
  .name('clusters')
  .description('Cluster information')
  .sql('SELECT ...')
  .columns('cluster', 'shard_count')
  .link('cluster', '/clusters/[cluster]')
  .build()
```

### Step 3: Run TypeScript Check

TypeScript will catch any errors:

```bash
pnpm exec tsc --noEmit
```

## Performance

The builder is zero-runtime overhead:

- No complex computations
- Simple object construction
- All validation happens at compile-time
- Final config is identical to manual object literal

## Testing

The builder comes with comprehensive test coverage (34 tests, 100% coverage):

```bash
pnpm jest -- lib/builder.test.ts
```

Tests cover:
- All methods and their chaining behavior
- Validation of required fields
- Error handling for missing fields
- Complete fluent interface workflows

## Best Practices

1. **Always define Row type first**: Make the shape of your data explicit

   ```typescript
   type Row = {
     column_name: string | number
     // ...
   }
   ```

2. **Use type-safe methods when possible**: Prefer `.link()` and `.actions()` over `.format()`

   ```typescript
   // Good - type-safe convenience method
   .link('cluster', '/clusters/[cluster]')

   // Also works but less convenient
   .format('cluster', ColumnFormat.Link, { href: '/clusters/[cluster]' })
   ```

3. **Put common settings in shared defaults**: Use `.defaultParams()` and `.settings()`

   ```typescript
   .defaultParams({ database: 'default', limit: 1000 })
   .settings({ readonly: 1, max_execution_time: 30 })
   ```

4. **Mark optional tables explicitly**: Use `.optional()` for tables that may not exist

   ```typescript
   .optional('system.backup_log')
   .optional(['system.error_log', 'system.zookeeper'])
   ```

5. **Export as const**: Make configurations immutable

   ```typescript
   export const queryConfig = defineQuery<Row>()
     // ...
     .build()
   ```

## See Also

- [QueryConfig Type Documentation](./QUERY_CONFIG.md)
- [Design Document](./design/query-config-v2.md)
- [ColumnFormat Reference](./COLUMN_FORMATS.md)
