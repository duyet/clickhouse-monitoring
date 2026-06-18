import type { DeclarativeQueryConfig } from '../../schema'

export const metricsDeclarative: DeclarativeQueryConfig = {
  name: 'metrics',
  optional: false,
  defaultView: 'auto',
  card: { primary: 'metric' },
  permission: { feature: 'metrics' },
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
    metric: 'code',
    value: 'code',
  },
}
