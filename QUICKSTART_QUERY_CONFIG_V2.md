# QueryConfig v2 Quick Start Guide

## Overview

QueryConfig v2 provides compile-time type safety for ClickHouse monitoring dashboard configurations. It validates:

- Column names match the Row type
- Format types have correct options
- Filter preset keys exist in the Row type
- Template URL placeholders are valid

## 5-Minute Setup

### Step 1: Define Your Row Type

```typescript
// app/[host]/my-view/config.ts

export type Row = {
  id: string
  name: string
  count: number
  status: string
}
```

### Step 2: Import QueryConfig v2

```typescript
import type { QueryConfig } from '@/types/query-config-v2'
import { ColumnFormat } from '@/types/column-format'
```

### Step 3: Create Your Configuration

```typescript
export const queryConfig: QueryConfig<Row> = {
  name: 'my_view',
  sql: `SELECT id, name, count, status FROM table`,
  columns: ['id', 'name', 'count', 'status'],

  columnFormats: {
    id: [ColumnFormat.Link, { href: '/items/[id]' }],
    name: ColumnFormat.Text,
    count: ColumnFormat.Number,
    status: ColumnFormat.Badge,
  },

  filterParamPresets: [
    { name: 'Active', key: 'status', value: 'active' },
  ],
}
```

That's it! TypeScript will validate everything.

## Key Features

### 1. Column Name Validation

TypeScript validates all column names against the Row type:

```typescript
// ✓ Correct - both columns exist in Row
columns: ['id', 'name'],

// ✗ Error - 'invalid_column' not in Row type
columns: ['id', 'invalid_column'],
```

### 2. Format Options Validation

TypeScript validates format options match the format type:

```typescript
// ✓ Correct - Link requires href
id: [ColumnFormat.Link, { href: '/items/[id]' }],

// ✗ Error - Wrong options for Link
id: [ColumnFormat.Link, { max_truncate: 100 }],

// ✓ Correct - Text can be alone or with options
name: ColumnFormat.Text,
name: [ColumnFormat.Text, { weight: 'bold' }],
```

### 3. Filter Key Validation

TypeScript validates filter preset keys exist in Row type:

```typescript
// ✓ Correct - 'status' exists in Row
filterParamPresets: [
  { name: 'Active', key: 'status', value: 'active' }
],

// ✗ Error - 'invalid_key' not in Row
filterParamPresets: [
  { name: 'Bad', key: 'invalid_key', value: 'bad' }
],
```

## Common Use Cases

### Case 1: Simple Table Display

```typescript
type Row = {
  id: string
  name: string
  created_at: string
}

const config: QueryConfig<Row> = {
  name: 'items',
  sql: `SELECT id, name, created_at FROM items`,
  columns: ['id', 'name', 'created_at'],
  columnFormats: {
    id: ColumnFormat.Badge,
    name: ColumnFormat.Text,
    created_at: ColumnFormat.RelatedTime,
  },
}
```

### Case 2: With Navigation Links

```typescript
type Row = {
  database: string
  table: string
  size_bytes: number
}

const config: QueryConfig<Row> = {
  name: 'tables',
  sql: `SELECT database, table, size_bytes FROM tables`,
  columns: ['database', 'table', 'size_bytes'],
  columnFormats: {
    database: [ColumnFormat.Link, { href: '/databases/[database]' }],
    table: [ColumnFormat.Link, { href: '/databases/[database]/tables/[table]' }],
    size_bytes: ColumnFormat.Number,
  },
}
```

### Case 3: With Filtering

```typescript
type Row = {
  query_id: string
  query: string
  status: 'running' | 'finished' | 'failed'
}

const config: QueryConfig<Row> = {
  name: 'queries',
  sql: `SELECT query_id, query, status FROM queries`,
  columns: ['query_id', 'query', 'status'],
  columnFormats: {
    query: [ColumnFormat.CodeDialog, { max_truncate: 200 }],
    status: ColumnFormat.Badge,
  },
  filterParamPresets: [
    { name: 'Running', key: 'status', value: 'running' },
    { name: 'Finished', key: 'status', value: 'finished' },
    { name: 'Failed', key: 'status', value: 'failed' },
  ],
}
```

### Case 4: Complex Configuration

```typescript
type Row = {
  cluster: string
  shard_count: number
  replica_count: number
  health: 'healthy' | 'degraded' | 'critical'
  last_update: string
}

const config: QueryConfig<Row> = {
  name: 'clusters',
  description: 'Cluster health and status',
  sql: `SELECT cluster, shard_count, replica_count, health, last_update FROM clusters`,
  columns: ['cluster', 'shard_count', 'replica_count', 'health', 'last_update'],

  columnFormats: {
    cluster: [ColumnFormat.Link, { href: '/clusters/[cluster]' }],
    shard_count: ColumnFormat.Number,
    replica_count: ColumnFormat.Number,
    health: ColumnFormat.Badge,
    last_update: ColumnFormat.RelatedTime,
  },

  columnIcons: {
    health: HealthIcon,
  },

  sortingFns: {
    shard_count: 'auto',
    replica_count: 'auto',
  },

  filterParamPresets: [
    { name: 'Healthy', key: 'health', value: 'healthy' },
    { name: 'Degraded', key: 'health', value: 'degraded' },
    { name: 'Critical', key: 'health', value: 'critical' },
  ],

  relatedCharts: [
    'cluster-size',
    ['cluster-health', { height: 400 }],
  ],
}
```

## IDE Features

With QueryConfig v2, your IDE provides:

### 1. Autocomplete for Columns

When typing `columns:`, your IDE shows:
```
columns: [
  'id',           // ← autocomplete suggestion
  'name',         // ← autocomplete suggestion
  'count',        // ← autocomplete suggestion
]
```

### 2. Autocomplete for Format Keys

When typing `columnFormats:`, your IDE shows:
```
columnFormats: {
  id,    // ← autocomplete suggestion
  name,  // ← autocomplete suggestion
  count, // ← autocomplete suggestion
}
```

### 3. Option Suggestions per Format

When typing `[ColumnFormat.Link, { ... }]`, your IDE shows:
```
{
  href: '',                // ← required option
  external: true,          // ← optional option
}
```

### 4. Validation Errors

Invalid code shows red squiggles:

```typescript
columnFormats: {
  invalid_column: ColumnFormat.Text,  // ← Red squiggle: not in Row
  id: [ColumnFormat.Link, {}],        // ← Red squiggle: missing href
}
```

## Format Categories

### Formats That Require Options
- **Link** - Must provide `href`
- **Action** - Must provide action array
- **HoverCard** - Must provide `content`

### Formats With Optional Options
- Text, CodeDialog, CodeToggle, ColoredBadge, Markdown, BackgroundBar

### Formats Without Options
- Badge, Boolean, Code, Duration, Number, NumberShort, RelatedTime, None

## Context Keys in URLs

Use `[ctx.KEY]` syntax for context-provided values:

```typescript
// Available context keys:
href: '/[ctx.hostId]/clusters/[cluster]'  // hostId from context, cluster from row
href: '/[ctx.database]/tables/[table]'    // database from context, table from row

// Context keys available:
// - [ctx.hostId]   - Current host
// - [ctx.database] - Current database
// - [ctx.table]    - Current table
// - [ctx.cluster]  - Current cluster
```

## Migration from Old Style

### Before (Untyped)

```typescript
export const queryConfig: QueryConfig = {
  columns: ['id', 'typo_column'],  // No error!
  columnFormats: {
    id: [ColumnFormat.Link, {}],  // Wrong options!
    name: ColumnFormat.Link,       // No options!
  },
}
```

### After (Typed)

```typescript
type Row = { id: string; name: string }

export const queryConfig: QueryConfig<Row> = {
  columns: ['id', 'name'],  // TypeScript validates
  columnFormats: {
    id: [ColumnFormat.Link, { href: '/items/[id]' }],  // Correct options
    name: ColumnFormat.Text,  // No options needed
  },
}
```

## Troubleshooting

### Problem: "Property 'X' does not exist"

**Solution:** Column name doesn't exist in Row type.

```typescript
// Fix: Check Row type and use correct column name
type Row = { id: string; status: string }
columns: ['id', 'status'],  // ✓ Correct
```

### Problem: "Type 'X' is not assignable to 'Y'"

**Solution:** Wrong format options.

```typescript
// Fix: Use correct options for the format
[ColumnFormat.Link, { href: '/path' }]  // ✓ Correct
```

### Problem: "Type '{}' is not assignable"

**Solution:** Missing required option.

```typescript
// Fix: Add required option
[ColumnFormat.Link, { href: '/path' }]  // ✓ href is required
```

## Reference Files

- **Main Type Definitions:** `/types/query-config-v2.ts`
- **Quick Reference:** `/types/QUERY_CONFIG_V2_REFERENCE.md`
- **Implementation Details:** `/IMPLEMENTATION_SUMMARY.md`

## Next Steps

1. Define your Row type
2. Create QueryConfig<Row> with correct generic parameter
3. Let TypeScript guide you with autocomplete and error messages
4. Enjoy compile-time validation!

## Questions?

See the detailed reference guide at:
`/types/QUERY_CONFIG_V2_REFERENCE.md`

Or check the implementation examples in:
`/IMPLEMENTATION_SUMMARY.md`
