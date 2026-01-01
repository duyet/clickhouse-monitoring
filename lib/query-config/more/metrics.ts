import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const metricsConfig: QueryConfig = {
  name: 'metrics',
  description:
    'Contains metrics which can be calculated instantly, or have a current value',
  tableCheck: 'system.metrics',
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
