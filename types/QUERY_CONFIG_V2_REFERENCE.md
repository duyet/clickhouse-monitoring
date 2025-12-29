# QueryConfig v2 Type Reference

## Quick Reference Guide

### 1. Extract Row Keys
Extract string keys from a row type for type-safe column references.

```typescript
import type { RowKeys } from '@/types/query-config-v2'

type Row = { id: string; name: string; count: number }
type Keys = RowKeys<Row>  // "id" | "name" | "count"

// Use in column arrays
const columns: RowKeys<Row>[] = ['id', 'name', 'count']
```

### 2. Define Row Type

Start by defining the row type for your query results.

```typescript
type Row = {
  cluster: string
  shard_count: number
  replica_count: number
  replica_status: string
  disk_size: number
}
```

### 3. Create QueryConfig with Type Safety

```typescript
import type { QueryConfig } from '@/types/query-config-v2'
import { ColumnFormat } from '@/types/column-format'

const queryConfig: QueryConfig<Row> = {
  name: 'clusters',
  description: 'Cluster information and status',
  sql: `
    SELECT
      cluster,
      countDistinct(shard_num) as shard_count,
      ...
  `,

  // Column names are validated against Row type
  columns: ['cluster', 'shard_count', 'replica_count', 'replica_status'],

  // Column formats with type-checked options
  columnFormats: {
    // Link requires options with href
    cluster: [ColumnFormat.Link, { href: '/clusters/[cluster]' }],

    // Text has optional options
    replica_status: ColumnFormat.Text,

    // Badge doesn't accept options
    disk_size: ColumnFormat.Number,
  },

  // Column icons
  columnIcons: {
    cluster: /* Icon component */,
  },

  // Sorting functions per column
  sortingFns: {
    shard_count: 'auto',
    replica_count: 'auto',
  },

  // Filter presets with type-safe keys
  filterParamPresets: [
    {
      name: 'Healthy',
      key: 'replica_status',  // Validated against Row
      value: 'Healthy',
    },
  ],

  // Other properties
  optional: false,
}
```

## Type Definitions

### Core Types

#### `RowKeys<TRow>`
Extract string keys from a row type.

```typescript
type RowKeys<TRow> = Extract<keyof TRow, string>
```

**Example:**
```typescript
type Row = { id: string; name: string }
type Keys = RowKeys<Row>  // "id" | "name"
```

---

#### `TemplatePlaceholder<TRow>`
Valid placeholder format for template URLs.

```typescript
type TemplatePlaceholder<TRow> =
  | `[${RowKeys<TRow>}]`
  | `[ctx.${ContextKey}]`
```

**Example:**
```typescript
// Valid placeholders: [id], [name], [ctx.hostId], [ctx.cluster]
```

---

#### `ValidatedTemplate<TRow, Template>`
Validates that template strings only use valid placeholders.

```typescript
type ValidatedTemplate<TRow, Template extends string> =
  Template extends `${infer Before}[${infer Key}]${infer After}`
    ? Key extends RowKeys<TRow> | `ctx.${ContextKey}`
      ? ValidatedTemplate<TRow, `${Before}${After}`>
      : never
    : Template
```

**Example:**
```typescript
// Valid: all placeholders exist in Row
type Valid = ValidatedTemplate<Row, '/items/[id]/[name]'>
// Result: '/items/[id]/[name]'

// Invalid: [invalid] not in Row
type Invalid = ValidatedTemplate<Row, '/items/[invalid]'>
// Result: never
```

---

#### `ColumnFormatSpec<TRow, TFormat>`
Type-safe format specification with options validation.

```typescript
type ColumnFormatSpec<TRow, TFormat extends ColumnFormat> =
  TFormat extends FormatsRequiringOptions
    ? [TFormat, FormatOptionsMap<TRow>[TFormat]]
    : TFormat extends FormatsWithOptionalOptions
      ? TFormat | [TFormat, FormatOptionsMap<TRow>[TFormat]]
      : TFormat extends FormatsWithoutOptions
        ? TFormat
        : never
```

**Example:**
```typescript
// Link requires options
type LinkSpec = ColumnFormatSpec<Row, ColumnFormat.Link>
// Result: [ColumnFormat.Link, LinkFormatOptions]

// Text has optional options
type TextSpec = ColumnFormatSpec<Row, ColumnFormat.Text>
// Result: ColumnFormat.Text | [ColumnFormat.Text, TextFormatOptions?]

// Badge doesn't accept options
type BadgeSpec = ColumnFormatSpec<Row, ColumnFormat.Badge>
// Result: ColumnFormat.Badge
```

---

### Configuration Types

#### `TypedColumnFormats<TRow>`
Type-safe column format record with keys validated against Row type.

```typescript
type TypedColumnFormats<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: ColumnFormat | ColumnFormatSpec<TRow, ColumnFormat>
}
```

**Example:**
```typescript
type Row = { id: string; name: string }
type Formats = TypedColumnFormats<Row>

const formats: Formats = {
  id: ColumnFormat.Badge,      // ✓ Valid
  name: ColumnFormat.Text,     // ✓ Valid
  // invalid: ColumnFormat.Number,  // ✗ Error
}
```

---

#### `TypedColumnIcons<TRow>`
Type-safe column icon record with keys validated against Row type.

```typescript
type TypedColumnIcons<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: Icon
}
```

**Example:**
```typescript
const icons: TypedColumnIcons<Row> = {
  id: ClockIcon,    // ✓ Valid
  name: UserIcon,   // ✓ Valid
}
```

---

#### `TypedSortingFns<TRow>`
Type-safe sorting function record with keys validated against Row type.

```typescript
type TypedSortingFns<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: CustomSortingFnNames | BuiltInSortingFn
}
```

**Example:**
```typescript
const sortingFns: TypedSortingFns<Row> = {
  id: 'alphanumeric',    // ✓ Valid
  name: 'auto',          // ✓ Valid
}
```

---

#### `TypedFilterPreset<TRow>`
Filter preset with type-safe key reference.

```typescript
interface TypedFilterPreset<TRow extends Record<string, unknown>> {
  name: string
  key: RowKeys<TRow>        // Validated against Row
  value: string
  icon?: Icon
}
```

**Example:**
```typescript
const preset: TypedFilterPreset<Row> = {
  name: 'Active',
  key: 'status',    // ✓ Must be key in Row
  value: 'active',
}
```

---

#### `QueryConfig<TRow>`
Main configuration interface with full type safety.

```typescript
interface QueryConfig<
  TRow extends Record<string, unknown> = Record<string, unknown>
> {
  name: string
  description?: string
  sql: string
  columns: RowKeys<TRow>[]
  columnFormats?: TypedColumnFormats<TRow>
  columnIcons?: TypedColumnIcons<TRow>
  sortingFns?: TypedSortingFns<TRow>
  relatedCharts?: ChartReference[]
  defaultParams?: Record<string, string | number | boolean>
  filterParamPresets?: TypedFilterPreset<TRow>[]
  clickhouseSettings?: ClickHouseSettings
  docs?: string
  optional?: boolean
  tableCheck?: string | string[]
  disableSqlValidation?: boolean
}
```

---

## Format Categories

### Formats Requiring Options

These formats **must** be provided with options:

- `ColumnFormat.Link` - Requires `href` option
- `ColumnFormat.Action` - Requires action array
- `ColumnFormat.HoverCard` - Requires `content` option

**Example:**
```typescript
// Valid
id: [ColumnFormat.Link, { href: '/items/[id]' }]

// Invalid - missing options
id: ColumnFormat.Link  // Error!
```

### Formats with Optional Options

These formats can be used alone or with options:

- `ColumnFormat.Text` - Optional `weight`, `align`
- `ColumnFormat.CodeDialog` - Optional `max_truncate`, `json`
- `ColumnFormat.CodeToggle` - Optional `language`
- `ColumnFormat.ColoredBadge` - Optional `color`
- `ColumnFormat.Markdown` - Optional `maxHeight`
- `ColumnFormat.BackgroundBar` - Optional `variant`

**Example:**
```typescript
// All valid
name: ColumnFormat.Text
name: [ColumnFormat.Text, { weight: 'bold' }]
```

### Formats Without Options

These formats **cannot** have options:

- `ColumnFormat.Badge`
- `ColumnFormat.Boolean`
- `ColumnFormat.Code`
- `ColumnFormat.Duration`
- `ColumnFormat.Number`
- `ColumnFormat.NumberShort`
- `ColumnFormat.RelatedTime`
- `ColumnFormat.None`

**Example:**
```typescript
// Valid
status: ColumnFormat.Badge

// Invalid - no options accepted
status: [ColumnFormat.Badge, {}]  // Error!
```

---

## Context Keys

Available in template placeholders with `[ctx.KEY]` syntax:

- `hostId` - Current host identifier
- `database` - Current database name
- `table` - Current table name
- `cluster` - Current cluster name

**Example:**
```typescript
href: '/[ctx.hostId]/clusters/[cluster]'
href: '/[ctx.database]/tables/[table]'
```

---

## Built-in Sorting Functions

Available in `sortingFns`:

```typescript
type BuiltInSortingFn =
  | 'auto'
  | 'alphanumeric'
  | 'alphanumericCaseSensitive'
  | 'text'
  | 'textCaseSensitive'
  | 'datetime'
  | 'basic'
```

---

## Common Patterns

### Pattern 1: Simple Column Display

```typescript
type Row = { id: string; name: string }

const config: QueryConfig<Row> = {
  name: 'items',
  sql: 'SELECT id, name FROM items',
  columns: ['id', 'name'],
  columnFormats: {
    id: ColumnFormat.Badge,
    name: ColumnFormat.Text,
  },
}
```

### Pattern 2: With Links

```typescript
const config: QueryConfig<Row> = {
  name: 'clusters',
  sql: 'SELECT cluster FROM clusters',
  columns: ['cluster'],
  columnFormats: {
    cluster: [ColumnFormat.Link, { href: '/clusters/[cluster]' }],
  },
}
```

### Pattern 3: With Filters

```typescript
const config: QueryConfig<Row> = {
  name: 'queries',
  sql: 'SELECT query_id, query FROM queries',
  columns: ['query_id', 'query'],
  filterParamPresets: [
    { name: 'Active', key: 'query_id', value: 'active' },
    { name: 'Error', key: 'query_id', value: 'error' },
  ],
}
```

### Pattern 4: Complex Configuration

```typescript
const config: QueryConfig<Row> = {
  name: 'comprehensive',
  description: 'Comprehensive query view',
  sql: 'SELECT * FROM metrics',
  columns: ['id', 'name', 'value', 'status'],

  columnFormats: {
    id: [ColumnFormat.Link, { href: '/items/[id]' }],
    value: [ColumnFormat.BackgroundBar, { variant: 'success' }],
    status: ColumnFormat.Badge,
  },

  columnIcons: {
    status: StatusIcon,
  },

  sortingFns: {
    value: 'numeric',
    status: 'alphanumeric',
  },

  filterParamPresets: [
    { name: 'Active', key: 'status', value: 'active', icon: CheckIcon },
  ],

  optional: false,
}
```

---

## Migration Examples

### From Old Style
```typescript
// Before (untyped)
export const config: QueryConfig = {
  columns: ['id', 'typo_column'],  // No error!
  columnFormats: {
    id: [ColumnFormat.Link, {}],  // Wrong options!
  },
}
```

### To New Style
```typescript
// After (typed)
type Row = { id: string; name: string }

export const config: QueryConfig<Row> = {
  columns: ['id', 'name'],  // TypeScript validates
  columnFormats: {
    id: [ColumnFormat.Link, { href: '/[id]' }],  // Options validated
  },
}
```

---

## Troubleshooting

### Error: Property 'X' does not exist

**Cause:** Column name in `columns` array doesn't exist in Row type.

**Solution:** Check Row type definition and fix column name.

```typescript
// Wrong
type Row = { id: string }
columns: ['id', 'invalid']  // Error!

// Correct
columns: ['id']
```

### Error: Type 'X' is not assignable

**Cause:** Wrong format options for the format type.

**Solution:** Check format category and provide correct options.

```typescript
// Wrong
[ColumnFormat.Link, { max_truncate: 100 }]  // Wrong options!

// Correct
[ColumnFormat.Link, { href: '/path/[id]' }]  // Correct options
```

### Error: Argument of type 'X' is not assignable to parameter of type 'Y'

**Cause:** Format key doesn't exist in Row type.

**Solution:** Use only keys from Row type.

```typescript
// Wrong
type Row = { id: string }
columnFormats: { name: ColumnFormat.Text }  // 'name' not in Row

// Correct
columnFormats: { id: ColumnFormat.Text }  // 'id' exists in Row
```

---

## File Location

```
types/
├── query-config.ts              # Original QueryConfig (deprecated)
├── query-config-v2.ts           # New generic QueryConfig<TRow> ✨
└── __query-config-v2.validation.ts  # Type validation tests
```

Import from: `@/types/query-config-v2`
