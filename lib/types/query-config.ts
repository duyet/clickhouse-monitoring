import type { ChartProps } from '@/components/charts/chart-props'
import type { ColumnFormat } from '@/components/data-table/columns'

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
   * }
   * ```
   */
  columnFormats?: {
    [key: string]: ColumnFormat | [ColumnFormat.Action, string[]]
  }
  relatedCharts?: string[] | [string, ChartProps][]
}
