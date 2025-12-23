# QueryConfig v2: Type-Safe Configuration Design

## Overview

This design document proposes improvements to the QueryConfig system for better TypeScript support, developer experience (DX), and user experience (UX). The goal is to enable compile-time validation of column references, format options, and template URLs.

## Current Pain Points

### 1. Loose Column Typing

```typescript
// Current: No connection between Row type and columns array
export type Row = { cluster: string; shard_count: number }
export const queryConfig: QueryConfig = {
  columns: ['cluster', 'shard_count', 'typo_column'], // No error for typo!
  columnFormats: { cluster: ColumnFormat.Badge }      // No error for missing column
}
```

### 2. Format Options Not Tied to Format Type

```typescript
// Current: Options type is not validated against format
columnFormats: {
  query: [ColumnFormat.Link, { max_truncate: 100 }] // Should error - wrong options!
}
```

### 3. Template URL Placeholders Unchecked

```typescript
// Current: No validation that [cluster] exists in Row
columnFormats: {
  name: [ColumnFormat.Link, { href: '/clusters/[cluster]' }] // No Row has 'cluster'
}
```

### 4. Inconsistent Export Naming

Files export `queryConfig`, `config`, `diskSpaceConfig` inconsistently.

---

## Proposed Design

### Core Types

```typescript
// types/query-config-v2.ts

/**
 * Extract keys from a Row type as a string literal union
 */
type RowKeys<TRow> = Extract<keyof TRow, string>

/**
 * Context keys available in template URLs
 */
type ContextKey = 'hostId' | 'database' | 'table' | 'cluster'

/**
 * Template placeholder - either from row data or context
 */
type TemplatePlaceholder<TRow> = `[${RowKeys<TRow>}]` | `[ctx.${ContextKey}]`

/**
 * Validate that a template string only uses valid placeholders
 * This is a branded type for compile-time safety
 */
type ValidatedTemplate<TRow, Template extends string> =
  Template extends `${infer Before}[${infer Key}]${infer After}`
    ? Key extends RowKeys<TRow> | `ctx.${ContextKey}`
      ? ValidatedTemplate<TRow, `${Before}${After}`>
      : never  // Invalid placeholder
    : Template

/**
 * Format-specific options with discriminated union
 */
interface FormatOptionsMap<TRow> {
  [ColumnFormat.Link]: {
    /** URL template with [column] or [ctx.key] placeholders */
    href: string
    /** Open in new tab */
    external?: boolean
  }
  [ColumnFormat.CodeDialog]: {
    /** Maximum characters before truncation */
    max_truncate?: number
    /** Hide query comment from display */
    hide_query_comment?: boolean
    /** Dialog title */
    dialog_title?: string
    /** Format as JSON */
    json?: boolean
  }
  [ColumnFormat.BackgroundBar]: {
    /** Column containing percentage value (defaults to pct_{columnName}) */
    percentColumn?: RowKeys<TRow>
    /** Color variant */
    variant?: 'default' | 'success' | 'warning' | 'danger'
  }
  [ColumnFormat.ColoredBadge]: {
    /** Fixed color instead of hash-based */
    color?: 'success' | 'warning' | 'info' | 'primary' | 'secondary' | 'tertiary'
  }
  [ColumnFormat.HoverCard]: {
    /** Content template with [column] placeholders */
    content: string
    /** Card title */
    title?: string
  }
  [ColumnFormat.Text]: {
    /** Text alignment */
    align?: 'left' | 'center' | 'right'
    /** Font weight */
    weight?: 'normal' | 'medium' | 'bold'
  }
  [ColumnFormat.Markdown]: {
    /** Max height before scroll */
    maxHeight?: number
  }
  [ColumnFormat.CodeToggle]: {
    /** Language for syntax highlighting */
    language?: 'sql' | 'json' | 'yaml' | 'text'
  }
  [ColumnFormat.Action]: Action[]
}

/**
 * Formats that require options
 */
type FormatsRequiringOptions =
  | ColumnFormat.Link
  | ColumnFormat.Action
  | ColumnFormat.HoverCard

/**
 * Formats that have optional options
 */
type FormatsWithOptionalOptions = Exclude<
  keyof FormatOptionsMap<any>,
  FormatsRequiringOptions
>

/**
 * Column format specification - type-safe union
 */
type ColumnFormatSpec<TRow, TFormat extends ColumnFormat> =
  TFormat extends FormatsRequiringOptions
    ? [TFormat, FormatOptionsMap<TRow>[TFormat]]
    : TFormat extends FormatsWithOptionalOptions
      ? TFormat | [TFormat, FormatOptionsMap<TRow>[TFormat]?]
      : TFormat

/**
 * Type-safe column formats record
 */
type TypedColumnFormats<TRow> = {
  [K in RowKeys<TRow>]?: ColumnFormat | ColumnFormatSpec<TRow, ColumnFormat>
}

/**
 * Type-safe column icons record
 */
type TypedColumnIcons<TRow> = {
  [K in RowKeys<TRow>]?: Icon
}

/**
 * Type-safe sorting functions record
 */
type TypedSortingFns<TRow> = {
  [K in RowKeys<TRow>]?: CustomSortingFnNames | BuiltInSortingFn
}

/**
 * Filter preset with type-safe key reference
 */
interface TypedFilterPreset<TRow> {
  name: string
  key: RowKeys<TRow>
  value: string
  icon?: Icon
}

/**
 * The improved QueryConfig with generic Row type
 */
interface QueryConfig<TRow extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique identifier for this query configuration */
  name: string

  /** Human-readable description for UI display */
  description?: string

  /** ClickHouse SQL query */
  sql: string

  /**
   * Columns to display in the table.
   * Must be keys of the Row type.
   */
  columns: RowKeys<TRow>[]

  /**
   * Column-specific formatting rules.
   * Keys must match columns in the Row type.
   */
  columnFormats?: TypedColumnFormats<TRow>

  /**
   * Icons to display in column headers.
   * Keys must match columns in the Row type.
   */
  columnIcons?: TypedColumnIcons<TRow>

  /**
   * Custom sorting functions per column.
   * Keys must match columns in the Row type.
   */
  sortingFns?: TypedSortingFns<TRow>

  /**
   * Related charts to display with this query.
   */
  relatedCharts?: ChartReference[]

  /**
   * Default query parameters for SQL placeholders.
   */
  defaultParams?: Record<string, string | number | boolean>

  /**
   * Predefined filter options for quick filtering.
   */
  filterParamPresets?: TypedFilterPreset<TRow>[]

  /**
   * ClickHouse-specific query settings.
   */
  clickhouseSettings?: ClickHouseSettings

  /**
   * Documentation URL for error messages.
   */
  docs?: string

  /**
   * Whether this query targets optional tables.
   */
  optional?: boolean

  /**
   * Explicit table names to validate for optional queries.
   */
  tableCheck?: string | string[]

  /**
   * Disable SQL validation in tests.
   */
  disableSqlValidation?: boolean
}
```

### Builder Pattern API

```typescript
// lib/query-config-builder.ts

/**
 * Fluent builder for creating type-safe QueryConfig objects
 */
class QueryConfigBuilder<TRow extends Record<string, unknown>> {
  private config: Partial<QueryConfig<TRow>> = {}

  static create<T extends Record<string, unknown>>(): QueryConfigBuilder<T> {
    return new QueryConfigBuilder<T>()
  }

  name(name: string): this {
    this.config.name = name
    return this
  }

  description(desc: string): this {
    this.config.description = desc
    return this
  }

  sql(query: string): this {
    this.config.sql = query
    return this
  }

  /**
   * Define columns with type-safe autocomplete
   */
  columns(...cols: RowKeys<TRow>[]): this {
    this.config.columns = cols
    return this
  }

  /**
   * Add column format with type-safe options
   */
  format<K extends RowKeys<TRow>, F extends ColumnFormat>(
    column: K,
    format: F,
    options?: F extends keyof FormatOptionsMap<TRow>
      ? FormatOptionsMap<TRow>[F]
      : never
  ): this {
    if (!this.config.columnFormats) {
      this.config.columnFormats = {}
    }
    this.config.columnFormats[column] = options
      ? [format, options] as any
      : format
    return this
  }

  /**
   * Add link format with type-safe URL template
   */
  link<K extends RowKeys<TRow>>(
    column: K,
    href: string,
    options?: Omit<FormatOptionsMap<TRow>[ColumnFormat.Link], 'href'>
  ): this {
    return this.format(column, ColumnFormat.Link, { href, ...options })
  }

  /**
   * Add action column
   */
  actions<K extends RowKeys<TRow>>(column: K, actions: Action[]): this {
    return this.format(column, ColumnFormat.Action, actions)
  }

  /**
   * Add column icon
   */
  icon<K extends RowKeys<TRow>>(column: K, icon: Icon): this {
    if (!this.config.columnIcons) {
      this.config.columnIcons = {}
    }
    this.config.columnIcons[column] = icon
    return this
  }

  /**
   * Add sorting function
   */
  sortBy<K extends RowKeys<TRow>>(
    column: K,
    fn: CustomSortingFnNames | BuiltInSortingFn
  ): this {
    if (!this.config.sortingFns) {
      this.config.sortingFns = {}
    }
    this.config.sortingFns[column] = fn
    return this
  }

  /**
   * Add related charts
   */
  charts(...charts: ChartReference[]): this {
    this.config.relatedCharts = charts
    return this
  }

  /**
   * Mark as optional with table check
   */
  optional(tableCheck?: string | string[]): this {
    this.config.optional = true
    if (tableCheck) {
      this.config.tableCheck = tableCheck
    }
    return this
  }

  /**
   * Build the final configuration
   */
  build(): QueryConfig<TRow> {
    if (!this.config.name) throw new Error('name is required')
    if (!this.config.sql) throw new Error('sql is required')
    if (!this.config.columns?.length) throw new Error('columns is required')

    return this.config as QueryConfig<TRow>
  }
}

// Export factory function
export const defineQuery = QueryConfigBuilder.create
```

### Helper Function API (Alternative)

```typescript
// lib/define-query.ts

/**
 * Type-safe query configuration factory
 * Provides full autocomplete and validation for Row type
 */
export function defineQuery<TRow extends Record<string, unknown>>(
  config: QueryConfig<TRow>
): QueryConfig<TRow> {
  return config
}

// Usage:
export type Row = {
  cluster: string
  shard_count: number
  replica_count: number
}

export const queryConfig = defineQuery<Row>({
  name: 'clusters',
  sql: '...',
  columns: ['cluster', 'shard_count'], // Autocomplete from Row!
  columnFormats: {
    cluster: [ColumnFormat.Link, { href: '/[ctx.hostId]/clusters/[cluster]' }],
    // TypeScript error: 'typo' is not in Row
    // typo: ColumnFormat.Badge,
  },
})
```

---

## Improved Action System

```typescript
// types/actions.ts

/**
 * Action registry with metadata
 */
interface ActionDefinition {
  /** Unique action identifier */
  id: string
  /** Display label */
  label: string
  /** Lucide icon component */
  icon?: Icon
  /** Variant for styling */
  variant?: 'default' | 'destructive' | 'warning'
  /** Required row fields for this action */
  requires?: string[]
  /** Confirmation dialog config */
  confirm?: {
    title: string
    description: string
    confirmLabel?: string
  }
}

/**
 * Action registry - extensible at runtime
 */
const actionRegistry = new Map<string, ActionDefinition>([
  ['kill-query', {
    id: 'kill-query',
    label: 'Kill Query',
    icon: XCircle,
    variant: 'destructive',
    requires: ['query_id'],
    confirm: {
      title: 'Kill Query',
      description: 'Are you sure you want to kill this query?',
    }
  }],
  ['explain-query', {
    id: 'explain-query',
    label: 'Explain Query',
    icon: FileSearch,
    requires: ['query'],
  }],
  ['optimize', {
    id: 'optimize',
    label: 'Optimize Table',
    icon: Zap,
    requires: ['database', 'table'],
    confirm: {
      title: 'Optimize Table',
      description: 'This may take a while for large tables.',
    }
  }],
])

/**
 * Register custom action
 */
export function registerAction(action: ActionDefinition): void {
  actionRegistry.set(action.id, action)
}

/**
 * Type-safe action reference
 */
export type Action = keyof typeof actionRegistry | (string & {})

/**
 * Get action metadata
 */
export function getAction(id: Action): ActionDefinition | undefined {
  return actionRegistry.get(id)
}
```

---

## Chart Reference Improvements

```typescript
// types/charts.ts

/**
 * Chart reference with type-safe props
 */
type ChartReference =
  | ChartKey  // Simple string reference
  | [ChartKey, ChartPropsOverride]  // With custom props

/**
 * All available chart keys (could be generated from chart files)
 */
type ChartKey =
  | 'disk-size'
  | 'disks-usage'
  | 'query-performance'
  | 'memory-usage'
  | 'merge-performance'
  | 'replication-lag'
  // ... add all chart keys

/**
 * Props that can be overridden per-chart
 */
interface ChartPropsOverride {
  title?: string
  interval?: 'toStartOfMinute' | 'toStartOfHour' | 'toStartOfDay'
  lastHours?: number
  height?: number
}
```

---

## Migration Strategy

### Phase 1: Add New Types (Non-Breaking)

1. Create `types/query-config-v2.ts` with new generic types
2. Create `lib/define-query.ts` helper function
3. Update documentation with new patterns

### Phase 2: Gradual Migration

1. Convert one config file at a time using `defineQuery<Row>()`
2. Run TypeScript to catch any type errors
3. Fix column name typos and format mismatches

### Phase 3: Deprecate Old Types

1. Add deprecation warnings to old `QueryConfig` type
2. Update remaining config files
3. Remove old type definitions

---

## Usage Examples

### Before (Current)

```typescript
// app/[host]/clusters/config.ts
import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export type Row = {
  cluster: string
  shard_count: number
  replica_count: number
  replica_status: string
}

export const queryConfig: QueryConfig = {
  name: 'clusters',
  description: 'Cluster information',
  sql: `SELECT cluster, countDistinct(shard_num) as shard_count...`,
  columns: ['cluster', 'shard_count', 'replica_count', 'replica_status'],
  columnFormats: {
    cluster: [ColumnFormat.Link, { href: `/[ctx.hostId]/clusters/[cluster]` }],
    replica_status: [
      ColumnFormat.Link,
      { href: `/[ctx.hostId]/clusters/[cluster]/replicas-status` },
    ],
  },
}
```

### After (With defineQuery)

```typescript
// app/[host]/clusters/config.ts
import { defineQuery } from '@/lib/define-query'
import { ColumnFormat } from '@/types/column-format'

export type Row = {
  cluster: string
  shard_count: number
  replica_count: number
  replica_status: string
}

export const queryConfig = defineQuery<Row>({
  name: 'clusters',
  description: 'Cluster information',
  sql: `SELECT cluster, countDistinct(shard_num) as shard_count...`,
  // Full autocomplete for column names from Row type!
  columns: ['cluster', 'shard_count', 'replica_count', 'replica_status'],
  columnFormats: {
    // TypeScript validates column name exists in Row
    cluster: [ColumnFormat.Link, { href: `/[ctx.hostId]/clusters/[cluster]` }],
    replica_status: [
      ColumnFormat.Link,
      { href: `/[ctx.hostId]/clusters/[cluster]/replicas-status` },
    ],
  },
})
```

### After (With Builder Pattern)

```typescript
// app/[host]/clusters/config.ts
import { defineQuery } from '@/lib/query-config-builder'
import { ColumnFormat } from '@/types/column-format'

export type Row = {
  cluster: string
  shard_count: number
  replica_count: number
  replica_status: string
}

export const queryConfig = defineQuery<Row>()
  .name('clusters')
  .description('Cluster information')
  .sql(`SELECT cluster, countDistinct(shard_num) as shard_count...`)
  .columns('cluster', 'shard_count', 'replica_count', 'replica_status')
  .link('cluster', '/[ctx.hostId]/clusters/[cluster]')
  .link('replica_status', '/[ctx.hostId]/clusters/[cluster]/replicas-status')
  .build()
```

---

## Benefits Summary

| Improvement | Before | After |
|-------------|--------|-------|
| Column name validation | Runtime error or silent fail | Compile-time error |
| Format options | Manual type checking | Discriminated union validation |
| Autocomplete | None for columns | Full IDE autocomplete |
| Template URLs | String, unchecked | Type-checked placeholders |
| Action definitions | String literals | Registry with metadata |
| Export naming | Inconsistent | Standardized `queryConfig` |
| Documentation | In comments | IntelliSense tooltips |

---

## Implementation Priority

1. **High**: `defineQuery<Row>()` helper function
2. **High**: Generic `QueryConfig<TRow>` type
3. **Medium**: `TypedColumnFormats<TRow>` with proper validation
4. **Medium**: Action registry pattern
5. **Low**: Builder pattern (nice-to-have)
6. **Low**: Template URL validation (complex TypeScript)

---

## File Structure

```
types/
├── query-config.ts      # Keep for backward compat (deprecated)
├── query-config-v2.ts   # New generic types
├── column-format.ts     # Enhanced with FormatOptionsMap
├── actions.ts           # Action registry
└── index.ts             # Re-exports

lib/
├── define-query.ts      # Simple factory function
└── query-config-builder.ts  # Optional builder pattern
```
