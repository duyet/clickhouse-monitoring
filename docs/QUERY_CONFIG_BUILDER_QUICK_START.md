# QueryConfigBuilder - Quick Start Guide

## Installation

Already included in the project. Import from:

```typescript
import { defineQuery, QueryConfigBuilder } from '@/lib/query-config-builder'
```

## 5-Minute Tutorial

### Step 1: Define Your Row Type

```typescript
type MyRow = {
  column_name: string
  value: number
}
```

### Step 2: Create Configuration

```typescript
export const queryConfig = defineQuery<MyRow>()
  .name('my-query')
  .sql('SELECT column_name, value FROM my_table')
  .columns('column_name', 'value')
  .build()
```

### Step 3: Add Formatting (Optional)

```typescript
export const queryConfig = defineQuery<MyRow>()
  .name('my-query')
  .sql('SELECT column_name, value FROM my_table')
  .columns('column_name', 'value')
  .format('value', ColumnFormat.Number)
  .link('column_name', '/details/[column_name]')
  .build()
```

Done! All fields are type-checked.

## Common Patterns

### Link Format

```typescript
.link('column_name', '/path/to/item/[column_name]')
.link('cluster', '/[ctx.hostId]/clusters/[cluster]', { external: true })
```

### Actions

```typescript
.actions('query_id', ['kill-query', 'explain-query'])
```

### Sorting

```typescript
.sortBy('value', 'sort_column_using_actual_value')
```

### Charts

```typescript
.charts('disk-size', 'memory-usage', 'query-performance')
```

### Optional Tables

```typescript
.optional()  // Mark entire config as optional
.optional('system.backup_log')  // Specific table
```

## Method Reference

| Method | Purpose | Required |
|--------|---------|----------|
| `.name()` | Config identifier | Yes |
| `.sql()` | SQL query | Yes |
| `.columns()` | Displayed columns | Yes |
| `.description()` | Human description | No |
| `.format()` | Column formatting | No |
| `.link()` | Make column a link | No |
| `.actions()` | Row actions | No |
| `.icon()` | Column icon | No |
| `.sortBy()` | Custom sorting | No |
| `.charts()` | Related charts | No |
| `.optional()` | Optional table | No |
| `.defaultParams()` | SQL parameters | No |
| `.settings()` | ClickHouse settings | No |
| `.docs()` | Documentation URL | No |
| `.disableSqlValidation()` | Skip SQL checks | No |
| `.build()` | Create final config | Yes |

## Complete Example

```typescript
import { defineQuery } from '@/lib/query-config-builder'
import { ColumnFormat } from '@/types/column-format'
import { CalendarIcon } from 'lucide-react'

type BackupRow = {
  backup_name: string
  status: string
  start_time: string
  size_bytes: number
}

export const queryConfig = defineQuery<BackupRow>()
  .name('backups')
  .description('Backup information and status')
  .sql('SELECT backup_name, status, start_time, size_bytes FROM system.backup_log')
  .columns('backup_name', 'status', 'start_time', 'size_bytes')
  .link('backup_name', '/backups/[backup_name]')
  .format('status', ColumnFormat.ColoredBadge, { color: 'success' })
  .format('size_bytes', ColumnFormat.Number)
  .icon('start_time', CalendarIcon)
  .sortBy('start_time', 'datetime')
  .charts('backup-size', 'backup-duration')
  .optional('system.backup_log')
  .defaultParams({ limit: 100 })
  .docs('https://clickhouse.com/docs/backup')
  .build()
```

## Type Safety

All column names are type-checked:

```typescript
type Row = { cluster: string; count: number }

// ✅ Valid
defineQuery<Row>().columns('cluster', 'count')

// ❌ Error: 'typo' doesn't exist in Row
defineQuery<Row>().columns('cluster', 'typo')
```

## Comparison

### Before (Manual Object)

```typescript
const config: QueryConfig = {
  name: 'query',
  sql: 'SELECT ...',
  columns: ['cluster', 'typo_column'],  // No error!
  columnFormats: { cluster: ColumnFormat.Badge }
}
```

### After (Builder)

```typescript
const config = defineQuery<ClusterRow>()
  .name('query')
  .sql('SELECT ...')
  .columns('cluster', 'typo_column')  // ✅ TypeScript error!
  .build()
```

## Tips

1. **Type safety first**: Always define Row type before using builder
2. **Method chaining**: All methods return builder for chaining
3. **IDE autocomplete**: Let TypeScript show you valid columns
4. **Validation**: `build()` catches missing required fields
5. **Documentation**: All methods have JSDoc for reference

## Common Mistakes

```typescript
// ❌ Wrong: Forgot to call build()
const config = defineQuery<Row>()
  .name('query')
  .sql('SELECT ...')
  .columns('col')
  // Missing .build()

// ❌ Wrong: Invalid column name
defineQuery<Row>().columns('invalid_column')

// ✅ Correct: All steps complete
const config = defineQuery<Row>()
  .name('query')
  .sql('SELECT ...')
  .columns('valid_column')
  .build()
```

## Need More Details?

See the full documentation: `docs/QUERY_CONFIG_BUILDER.md`
