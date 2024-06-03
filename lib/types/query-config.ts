import type { ChartProps } from '@/components/charts/chart-props'
import type {
  ColumnFormat,
  ColumnFormatOptions,
} from '@/components/data-table/column-defs'
import type { PartialBy } from '@/lib/types/generic'
import type { Icon } from '@/lib/types/icon'
import type { ClickHouseSettings } from '@clickhouse/client'

export interface QueryConfig {
  name: string
  description?: string
  sql: string
  columns: string[]
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
   */
  columnFormats?: {
    [key: string]: ColumnFormat | [ColumnFormat, ColumnFormatOptions]
  }
  relatedCharts?:
    | string[]
    | [string, ChartProps][]
    | (string | [string, ChartProps])[]
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
    sql: string
    icon?: Icon
  }[]
  /**
   * ClickHouse settings to be used for this query
   */
  clickhouseSettings?: ClickHouseSettings
}

export type QueryConfigNoName = PartialBy<QueryConfig, 'name'>
