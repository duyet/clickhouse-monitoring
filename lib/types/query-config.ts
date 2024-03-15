import type { ChartProps } from '@/components/charts/chart-props'
import type {
  ColumnFormat,
  ColumnFormatOptions,
} from '@/components/data-table/column-defs'
import type { PartialBy } from '@/lib/types/generic'

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
  relatedCharts?: string[] | [string, ChartProps][]
}

export type QueryConfigNoName = PartialBy<QueryConfig, 'name'>
