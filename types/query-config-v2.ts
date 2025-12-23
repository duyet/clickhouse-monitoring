import type { ClickHouseSettings } from '@clickhouse/client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { CustomSortingFnNames } from '@/components/data-table'
import type {
  Action,
  BackgroundBarOptions,
  CodeDialogOptions,
  CodeToggleOptions,
  ColoredBadgeOptions,
  HoverCardOptions,
  LinkFormatOptions,
  MarkdownFormatOptions,
  TextFormatOptions,
} from '@/components/data-table/cells'
import type { ColumnFormat } from '@/types/column-format'
import type { Icon } from '@/types/icon'

/**
 * Extract keys from a Row type as a string literal union.
 * This ensures type-safe references to row properties.
 *
 * @example
 * type MyRow = { id: string; name: string }
 * type Keys = RowKeys<MyRow> // "id" | "name"
 */
export type RowKeys<TRow> = Extract<keyof TRow, string>

/**
 * Context keys available in template URLs.
 * These are provided by the application context.
 */
export type ContextKey = 'hostId' | 'database' | 'table' | 'cluster'

/**
 * Template placeholder - either from row data or context.
 * Supports placeholders like [columnName] or [ctx.hostId]
 *
 * @example
 * type MyRow = { id: string; name: string }
 * type P = TemplatePlaceholder<MyRow> // "[id]" | "[name]" | "[ctx.hostId]" | etc.
 */
export type TemplatePlaceholder<TRow> =
  | `[${RowKeys<TRow>}]`
  | `[ctx.${ContextKey}]`

/**
 * Validate that a template string only uses valid placeholders.
 * This is a branded type for compile-time safety.
 *
 * @example
 * type Template = ValidatedTemplate<MyRow, '/item/[id]'>
 * // Valid if "id" exists in MyRow
 */
export type ValidatedTemplate<
  TRow,
  Template extends string,
> = Template extends `${infer Before}[${infer Key}]${infer After}`
  ? Key extends RowKeys<TRow> | `ctx.${ContextKey}`
    ? ValidatedTemplate<TRow, `${Before}${After}`>
    : never // Invalid placeholder
  : Template

/**
 * Built-in sorting function from TanStack Table.
 * Includes functions like 'alphanumeric', 'auto', 'datetime', etc.
 */
export type BuiltInSortingFn =
  | 'auto'
  | 'alphanumeric'
  | 'alphanumericCaseSensitive'
  | 'text'
  | 'textCaseSensitive'
  | 'datetime'
  | 'basic'

/**
 * Format-specific options with discriminated union.
 * Each format type has its own specific options interface.
 *
 * @typeParam TRow - Row type parameter (used for future extensibility, not currently utilized)
 */
export interface FormatOptionsMap<
  _TRow extends Record<string, unknown> = Record<string, unknown>,
> {
  [ColumnFormat.Link]: LinkFormatOptions
  [ColumnFormat.CodeDialog]: CodeDialogOptions
  [ColumnFormat.CodeToggle]: CodeToggleOptions
  [ColumnFormat.BackgroundBar]: BackgroundBarOptions
  [ColumnFormat.ColoredBadge]: ColoredBadgeOptions
  [ColumnFormat.HoverCard]: HoverCardOptions
  [ColumnFormat.Text]: TextFormatOptions
  [ColumnFormat.Markdown]: MarkdownFormatOptions
  [ColumnFormat.Action]: Action[]
  // Formats without options
  [ColumnFormat.Badge]: never
  [ColumnFormat.Boolean]: never
  [ColumnFormat.Code]: never
  [ColumnFormat.Duration]: never
  [ColumnFormat.NumberShort]: never
  [ColumnFormat.RelatedTime]: never
  [ColumnFormat.Number]: never
  [ColumnFormat.None]: never
}

/**
 * Formats that require options to be specified.
 * These formats must always be provided with options.
 */
export type FormatsRequiringOptions =
  | ColumnFormat.Link
  | ColumnFormat.Action
  | ColumnFormat.HoverCard

/**
 * Formats that have optional options.
 * These can be used as a simple enum value or with options array.
 */
export type FormatsWithOptionalOptions = Exclude<
  keyof FormatOptionsMap<any>,
  | FormatsRequiringOptions
  | ColumnFormat.Badge
  | ColumnFormat.Boolean
  | ColumnFormat.Code
  | ColumnFormat.Duration
  | ColumnFormat.NumberShort
  | ColumnFormat.RelatedTime
  | ColumnFormat.Number
  | ColumnFormat.None
>

/**
 * Formats that don't accept options.
 * These can only be used as simple enum values.
 */
export type FormatsWithoutOptions = Exclude<
  keyof FormatOptionsMap<any>,
  FormatsRequiringOptions | FormatsWithOptionalOptions
>

/**
 * Column format specification - type-safe union.
 * Enforces correct usage of options for each format type.
 *
 * @example
 * // Requires options
 * ColumnFormatSpec<MyRow, ColumnFormat.Link>
 * // => [ColumnFormat.Link, LinkFormatOptions]
 *
 * // Optional options
 * ColumnFormatSpec<MyRow, ColumnFormat.Text>
 * // => ColumnFormat.Text | [ColumnFormat.Text, TextFormatOptions?]
 *
 * // No options
 * ColumnFormatSpec<MyRow, ColumnFormat.Badge>
 * // => ColumnFormat.Badge
 */
export type ColumnFormatSpec<
  TRow extends Record<string, unknown>,
  TFormat extends ColumnFormat,
> = TFormat extends FormatsRequiringOptions
  ? [TFormat, FormatOptionsMap<TRow>[TFormat]]
  : TFormat extends FormatsWithOptionalOptions
    ? TFormat | [TFormat, FormatOptionsMap<TRow>[TFormat]]
    : TFormat extends FormatsWithoutOptions
      ? TFormat
      : never

/**
 * Type-safe column formats record.
 * Keys must match properties of the Row type.
 * Format types and options are validated together.
 *
 * @example
 * type MyRow = { id: string; count: number }
 * type Formats = TypedColumnFormats<MyRow>
 * // Keys "id" and "count" are validated
 * // Options must match the format type
 */
export type TypedColumnFormats<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: ColumnFormat | ColumnFormatSpec<TRow, ColumnFormat>
}

/**
 * Type-safe column icons record.
 * Keys must match properties of the Row type.
 *
 * @example
 * type MyRow = { createdAt: Date; status: string }
 * type Icons = TypedColumnIcons<MyRow>
 * // Keys "createdAt" and "status" are validated
 */
export type TypedColumnIcons<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: Icon
}

/**
 * Type-safe sorting functions record.
 * Keys must match properties of the Row type.
 *
 * @example
 * type MyRow = { name: string; createdAt: Date }
 * type Sorting = TypedSortingFns<MyRow>
 * // Keys "name" and "createdAt" are validated
 */
export type TypedSortingFns<TRow extends Record<string, unknown>> = {
  [K in RowKeys<TRow>]?: CustomSortingFnNames | BuiltInSortingFn
}

/**
 * Chart reference - either a string key or with custom props override.
 * Simple string references use default chart properties.
 *
 * @example
 * type ChartRef = ChartReference
 * // Can be: 'disk-usage' | ['memory-usage', { height: 400 }]
 */
export type ChartReference =
  | string // Simple chart key
  | [string, Omit<ChartProps, 'hostId'>] // Chart with custom props

/**
 * Filter preset with type-safe key reference.
 * The key must correspond to a property in the Row type.
 *
 * @example
 * type MyRow = { status: string; active: boolean }
 * type Preset = TypedFilterPreset<MyRow>
 * // key must be 'status' or 'active'
 */
export interface TypedFilterPreset<TRow extends Record<string, unknown>> {
  /** Display name for the preset */
  name: string

  /** Key must match a property in the Row type */
  key: RowKeys<TRow>

  /** Filter value to apply */
  value: string

  /** Optional icon for visual identification */
  icon?: Icon
}

/**
 * The improved QueryConfig with generic Row type.
 * Provides compile-time validation of column references, format options, and template URLs.
 *
 * @typeParam TRow - The row data type, determines valid column names and placeholder keys
 *
 * @example
 * type Row = {
 *   cluster: string
 *   shard_count: number
 *   replica_status: string
 * }
 *
 * const queryConfig: QueryConfig<Row> = {
 *   name: 'clusters',
 *   sql: 'SELECT ...',
 *   columns: ['cluster', 'shard_count'], // Type-checked
 *   columnFormats: {
 *     cluster: [ColumnFormat.Link, { href: '/[cluster]' }], // Type-checked
 *   },
 * }
 */
export interface QueryConfig<
  TRow extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Unique identifier for this query configuration */
  name: string

  /** Human-readable description for UI display */
  description?: string

  /** ClickHouse SQL query to execute */
  sql: string

  /**
   * Columns to display in the table.
   * Must be keys of the Row type for type safety.
   */
  columns: RowKeys<TRow>[]

  /**
   * Column-specific formatting rules.
   * Keys must match columns in the Row type.
   * Format types and their options are validated together.
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
   * Can use custom sorting functions or built-in ones.
   */
  sortingFns?: TypedSortingFns<TRow>

  /**
   * Related charts to display with this query.
   * Charts can be simple string references or include custom props.
   */
  relatedCharts?: ChartReference[]

  /**
   * Default query parameters for SQL placeholders.
   * Used in parameterized queries with {param: Type} syntax.
   */
  defaultParams?: Record<string, string | number | boolean>

  /**
   * Predefined filter options for quick filtering.
   * Filter keys must match properties in the Row type.
   */
  filterParamPresets?: TypedFilterPreset<TRow>[]

  /**
   * ClickHouse-specific query settings.
   * Advanced configuration for query execution.
   */
  clickhouseSettings?: ClickHouseSettings

  /**
   * Documentation URL for error messages.
   * Shown to users when the query fails or table doesn't exist.
   */
  docs?: string

  /**
   * Whether this query targets optional tables that may not exist.
   * Optional queries gracefully handle missing tables instead of errors.
   */
  optional?: boolean

  /**
   * Explicit table names to validate for optional queries.
   * If not provided, tables are automatically extracted from the SQL query.
   *
   * @example
   * tableCheck: 'system.backup_log'
   * tableCheck: ['system.backup_log', 'system.error_log']
   */
  tableCheck?: string | string[]

  /**
   * Disable SQL validation in tests.
   * Set to true if SQL uses custom syntax or parameterized queries.
   */
  disableSqlValidation?: boolean
}
