import type { BuiltInSortingFn } from '@tanstack/react-table'

import type { Action } from '@/components/data-table/cells/actions'
import type { ClickHouseSettings } from '@clickhouse/client'
import { ColumnFormat, type ColumnFormatWithArgs } from '@/types/column-format'
import type { Icon } from '@/types/icon'
import type { QueryConfig } from '@/types/query-config'
import type { CustomSortingFnNames } from '@/components/data-table'

/**
 * Extract string literal keys from a Row type
 */
type RowKeys<TRow> = Extract<keyof TRow, string>

/**
 * Fluent builder for creating type-safe QueryConfig objects
 *
 * @example
 * ```typescript
 * export type Row = {
 *   cluster: string
 *   shard_count: number
 *   replica_status: string
 * }
 *
 * export const queryConfig = QueryConfigBuilder.create<Row>()
 *   .name('clusters')
 *   .description('Cluster information')
 *   .sql('SELECT cluster, countDistinct(shard_num) as shard_count...')
 *   .columns('cluster', 'shard_count', 'replica_status')
 *   .link('cluster', '/[ctx.hostId]/clusters/[cluster]')
 *   .build()
 * ```
 */
export class QueryConfigBuilder<
  TRow extends Record<string, unknown> = Record<string, unknown>,
> {
  private config: Partial<QueryConfig> = {}

  /**
   * Create a new QueryConfigBuilder instance
   *
   * @template T The row type for type-safe column references
   * @returns A new QueryConfigBuilder instance
   */
  static create<T extends Record<string, unknown>>(): QueryConfigBuilder<T> {
    return new QueryConfigBuilder<T>()
  }

  /**
   * Set the unique identifier for this query configuration
   *
   * @param name The configuration name
   * @returns The builder instance for method chaining
   */
  name(name: string): this {
    this.config.name = name
    return this
  }

  /**
   * Set the human-readable description for UI display
   *
   * @param desc The description text
   * @returns The builder instance for method chaining
   */
  description(desc: string): this {
    this.config.description = desc
    return this
  }

  /**
   * Set the ClickHouse SQL query
   *
   * @param query The SQL query string
   * @returns The builder instance for method chaining
   */
  sql(query: string): this {
    this.config.sql = query
    return this
  }

  /**
   * Define which columns to display in the table
   * Column names are type-safe and must exist in the Row type
   *
   * @param cols Column names from the Row type
   * @returns The builder instance for method chaining
   */
  columns(...cols: RowKeys<TRow>[]): this {
    this.config.columns = cols as string[]
    return this
  }

  /**
   * Add a column format with type-safe options
   * Format options are validated based on the format type
   *
   * @template K The column key from Row type
   * @param column The column name to format
   * @param format The column format type
   * @param options Format-specific options (type depends on format)
   * @returns The builder instance for method chaining
   */
  format<K extends RowKeys<TRow>>(
    column: K,
    format: ColumnFormat,
    options?: any
  ): this {
    if (!this.config.columnFormats) {
      this.config.columnFormats = {}
    }
    this.config.columnFormats[column as string] = options
      ? ([format, options] as ColumnFormatWithArgs)
      : format
    return this
  }

  /**
   * Add a Link format to a column (convenience method)
   * Creates a link with an href template that can use [column] and [ctx.key] placeholders
   *
   * @template K The column key from Row type
   * @param column The column name to format as a link
   * @param href The link template (e.g., '/clusters/[cluster]' or '/[ctx.hostId]/clusters/[cluster]')
   * @param options Additional options like external flag
   * @returns The builder instance for method chaining
   */
  link<K extends RowKeys<TRow>>(
    column: K,
    href: string,
    options?: { external?: boolean }
  ): this {
    return this.format(column, ColumnFormat.Link, { href, ...options })
  }

  /**
   * Add an Action format to a column (convenience method)
   * Defines which actions are available for rows in this column
   *
   * @template K The column key from Row type
   * @param column The column name to add actions to
   * @param actions Array of action identifiers
   * @returns The builder instance for method chaining
   */
  actions<K extends RowKeys<TRow>>(column: K, actions: Action[]): this {
    return this.format(column, ColumnFormat.Action, actions)
  }

  /**
   * Add an icon to a column header
   * Icon will be displayed next to the column name
   *
   * @template K The column key from Row type
   * @param column The column name to add an icon to
   * @param icon The icon component (from lucide-react or @radix-ui/react-icons)
   * @returns The builder instance for method chaining
   */
  icon<K extends RowKeys<TRow>>(column: K, icon: Icon): this {
    if (!this.config.columnIcons) {
      this.config.columnIcons = {}
    }
    this.config.columnIcons[column as string] = icon
    return this
  }

  /**
   * Add a custom sorting function for a column
   * Allows custom sorting logic beyond default comparisons
   *
   * @template K The column key from Row type
   * @param column The column name to add sorting for
   * @param fn The sorting function name or built-in sorting function
   * @returns The builder instance for method chaining
   */
  sortBy<K extends RowKeys<TRow>>(
    column: K,
    fn: CustomSortingFnNames | BuiltInSortingFn
  ): this {
    if (!this.config.sortingFns) {
      this.config.sortingFns = {}
    }
    this.config.sortingFns[column as string] = fn as any
    return this
  }

  /**
   * Add related charts to display with this query
   * Charts can be simple string references or tuples with custom props
   *
   * @param charts Chart references to display
   * @returns The builder instance for method chaining
   */
  charts(...charts: any[]): this {
    this.config.relatedCharts = charts
    return this
  }

  /**
   * Mark this query as optional (targets optional tables)
   * Optional queries won't error if the underlying table doesn't exist
   *
   * @param tableCheck Explicit table(s) to validate for existence
   * @returns The builder instance for method chaining
   */
  optional(tableCheck?: string | string[]): this {
    this.config.optional = true
    if (tableCheck) {
      this.config.tableCheck = tableCheck
    }
    return this
  }

  /**
   * Add default parameters for SQL placeholders
   *
   * @param params Default parameters to use in the query
   * @returns The builder instance for method chaining
   */
  defaultParams(params: Record<string, string | number | boolean>): this {
    this.config.defaultParams = params
    return this
  }

  /**
   * Add ClickHouse-specific query settings
   *
   * @param settings ClickHouse query settings
   * @returns The builder instance for method chaining
   */
  settings(settings: ClickHouseSettings): this {
    this.config.clickhouseSettings = settings
    return this
  }

  /**
   * Add documentation URL for error messages
   *
   * @param docs URL to documentation
   * @returns The builder instance for method chaining
   */
  docs(docs: string): this {
    this.config.docs = docs
    return this
  }

  /**
   * Disable SQL validation in tests
   *
   * @param disabled Whether to disable SQL validation
   * @returns The builder instance for method chaining
   */
  disableSqlValidation(disabled: boolean = true): this {
    this.config.disableSqlValidation = disabled
    return this
  }

  /**
   * Build and return the final QueryConfig object
   * Validates that all required fields are set before building
   *
   * @throws Error if name, sql, or columns are not set
   * @returns A complete QueryConfig object
   */
  build(): QueryConfig {
    if (!this.config.name) {
      throw new Error('name is required')
    }
    if (!this.config.sql) {
      throw new Error('sql is required')
    }
    if (!this.config.columns?.length) {
      throw new Error('columns are required')
    }

    return this.config as QueryConfig
  }
}

/**
 * Factory function for creating a new QueryConfigBuilder
 * Convenience alias for QueryConfigBuilder.create()
 *
 * @example
 * ```typescript
 * export const queryConfig = defineQuery<Row>()
 *   .name('clusters')
 *   .sql('SELECT ...')
 *   .columns('cluster', 'shard_count')
 *   .build()
 * ```
 */
export const defineQuery = QueryConfigBuilder.create
