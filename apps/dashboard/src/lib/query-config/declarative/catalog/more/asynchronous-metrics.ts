import type { DeclarativeQueryConfig } from '../../schema'

export const asynchronousMetricsDeclarative: DeclarativeQueryConfig = {
  name: 'asynchronous-metrics',
  defaultView: 'auto',
  card: { primary: 'metric' },
  description:
    'Contains metrics that are calculated periodically in the background. For example, the amount of RAM in use',
  optional: false,
  tableCheck: 'system.asynchronous_metrics',
  sql: `
      SELECT *
      FROM system.asynchronous_metrics
      ORDER BY metric
    `,
  columns: ['metric', 'value', 'description'],
  columnFormats: {
    metric: 'code',
    value: 'code',
  },
}
