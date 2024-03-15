import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const asynchronousMetricsConfig: QueryConfig = {
  name: 'asynchronous-metrics',
  description:
    'Contains metrics that are calculated periodically in the background. For example, the amount of RAM in use',
  sql: `
      SELECT *
      FROM system.asynchronous_metrics
      ORDER BY metric
    `,
  columns: ['metric', 'value', 'description'],
  columnFormats: {
    metric: ColumnFormat.Code,
    value: ColumnFormat.Code,
  },
}
