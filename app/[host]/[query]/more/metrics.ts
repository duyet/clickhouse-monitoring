import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const metricsConfig: QueryConfig = {
  name: 'metrics',
  description:
    'Contains metrics which can be calculated instantly, or have a current value',
  sql: `
      SELECT *
      FROM system.metrics
      ORDER BY metric
    `,
  columns: ['metric', 'value', 'description'],
  columnFormats: {
    metric: ColumnFormat.Code,
    value: ColumnFormat.Code,
  },
}
