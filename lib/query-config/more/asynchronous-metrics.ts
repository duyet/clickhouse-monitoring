import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const asynchronousMetricsConfig: QueryConfig = {
  name: 'asynchronous-metrics',
  description:
    'Contains metrics that are calculated periodically in the background. For example, the amount of RAM in use',
  tableCheck: 'system.asynchronous_metrics',
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
