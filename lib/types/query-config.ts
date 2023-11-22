import type { ChartProps } from '@/components/charts/chart-props'
import type { ColumnFormat } from '@/components/data-table/columns'

export interface QueryConfig {
  name: string
  description?: string
  sql: string
  columns: string[]
  columnFormats?: { [key: string]: ColumnFormat }
  relatedCharts?: string[] | [string, ChartProps][]
}
