import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

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
