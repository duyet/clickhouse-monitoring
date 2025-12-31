import type { ClickHouseSettings } from '@clickhouse/client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { CustomSortingFnNames } from '@/components/data-table/sorting-fns'
import type { ColumnFormat, ColumnFormatWithArgs } from '@/types/column-format'
import type { PartialBy } from '@/types/generic'
import type { Icon } from '@/types/icon'

/**
 * Infer row data type from column names array
 *
 * @example
 * ```ts
 * type RowData = QueryConfigRowData<['database', 'table', 'engine']>
 * // Result: { database: unknown; table: unknown; engine: unknown }
 * ```
 */
export type QueryConfigRowData<T extends readonly string[]> = {
  [K in T[number]]: unknown
}

/**
 * Convert readonly array to mutable tuple for stricter column typing
 *
 * @example
 * ```ts
 * type Columns = ColumnNames<'database' | 'table' | 'engine'>
 * // Result: ['database', 'table', 'engine']
 * ```
 */
export type ColumnNames<T extends string> = [T, ...T[]]

export interface QueryConfig<TColumns extends readonly string[] = string[]> {
  name: string
  description?: string
  sql: string
  /**
   * Whether to disable the SQL validation by [query-config.test.ts](query-config.test.ts).
   *
   * Default: false
   */
  disableSqlValidation?: boolean
  columns: TColumns
  /**
   * Column format can be specified as a enum ColumnFormat
   * or an array of two elements [ColumnFormat.Action, arg]
   *
   * Example:
   *
   * ```ts
   * columnFormats: {
   *   query: ColumnFormat.Code,
   *   changed: ColumnFormat.Boolean,
   *   query_id: [ColumnFormat.Action, ['kill-query']],
   *   table: [ColumnFormat.Link, { href: '/tables/[table]' }],
   * }
   * ```
   *
   * When using typed columns, columnFormats are restricted to valid column names:
   * ```ts
   * const config: QueryConfig<['database', 'table']> = {
   *   columns: ['database', 'table'],
   *   columnFormats: {
   *     database: ColumnFormat.Text,  // OK
   *     table: ColumnFormat.Text,     // OK
   *     invalid: ColumnFormat.Text,   // Type error!
   *   }
   * }
   * ```
   */
  columnFormats?: Partial<
    Record<TColumns[number], ColumnFormat | ColumnFormatWithArgs>
  >
  /**
   * Column icons can be specified as React Component name.
   *
   * Example:
   * ```ts
   * import { CalendarIcon } from 'lucide-react'
   * import { GlobeIcon } from '@radix-ui/react-icons'
   * columnIcons: {
   *  date: CalendarIcon,
   *  language: GlobeIcon
   * }
   * ```
   */
  columnIcons?: {
    [key: string]: Icon
  }
  relatedCharts?:
    | string[]
    | [string, Omit<ChartProps, 'hostId'>][]
    | (string | [string, Omit<ChartProps, 'hostId'>])[]
  /**
   * Default parameters for the query
   * For example in the query:
   * ```sql
   * SELECT * FROM system.tables WHERE database = {database: String}
   * ```
   * The default parameters would be:
   * ```json
   * { defaultParams: { database: 'default' } }
   * ```
   */
  defaultParams?: Record<string, string | number | boolean>
  /**
   * Filter presets are predefined filters that can be applied to the query
   * For example:
   * ```ts
   * filterPresets: [
   *  {
   *    name: 'Changed only',
   *    key: 'changed',
   *    sql: 'changed = 1',
   *  },
   * ]
   */
  filterParamPresets?: {
    name: string
    key: string
    value: string
    icon?: Icon
  }[]
  /**
   * ClickHouse settings to be used for this query
   */
  clickhouseSettings?: ClickHouseSettings
  /**
   * The documents or url to be used when query is errors. e.g. log table missing due to cluster configuration.
   */
  docs?: string
  /**
   * Whether the query is optional or not. If the query is optional, it can be raised as a error due to missing table or view.
   * e.g. system.error_log (when there is no error), system.zookeeper (when zookeeper is not configured), system.backup_log (when there is no backup).
   *
   * Default: false
   */
  optional?: boolean
  /**
   * Explicit table(s) to check for existence when the query is marked as optional.
   * If not provided, tables will be automatically extracted from the SQL query.
   *
   * Example:
   * ```ts
   * tableCheck: "system.backup_log"
   * ```
   *
   * For multiple tables:
   * ```ts
   * tableCheck: ["system.backup_log", "system.error_log"]
   * ```
   */
  tableCheck?: string | string[]
  /**
   * Sorting functions to be used for table.
   *
   * Example:
   * ```ts
   * sortingFns: {
   *   readable_avg_part_size_compressed: 'sort_column_using_pct',
   *   readable_avg_part_size_uncompressed: 'sort_column_using_pct',
   * }
   * ```
   */
  sortingFns?: Record<string, CustomSortingFnNames>
}

export type QueryConfigNoName<TColumns extends readonly string[] = string[]> =
  PartialBy<QueryConfig<TColumns>, 'name'>

/**
 * Helper type to extract row data from a QueryConfig
 *
 * @example
 * ```ts
 * const tablesConfig: QueryConfig<['database', 'table']> = { ... }
 * type TablesRow = QueryConfigToRowData<typeof tablesConfig>
 * // Result: { database: unknown; table: unknown }
 * ```
 */
export type QueryConfigToRowData<T extends QueryConfig> = QueryConfigRowData<
  T['columns']
>
