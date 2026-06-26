import type { DeclarativeQueryConfig } from '../../schema'

export const indexAnalyticsDeclarative: DeclarativeQueryConfig = {
  name: 'index-analytics',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['database', 'table', 'type'] },
  description:
    'Data-skipping index inventory: storage cost, type, and expression per table (system.data_skipping_indices). Flag dead/empty indexes.',
  refreshInterval: 60_000,
  optional: true,
  tableCheck: 'system.data_skipping_indices',
  sql: `
    SELECT
      database,
      table,
      name,
      type,
      type_full,
      expr,
      granularity,
      data_compressed_bytes,
      formatReadableSize(data_compressed_bytes) AS readable_compressed,
      round(data_compressed_bytes * 100.0 / nullIf(max(data_compressed_bytes) OVER (), 0), 2) AS pct_compressed,
      data_uncompressed_bytes,
      formatReadableSize(data_uncompressed_bytes) AS readable_uncompressed,
      if(data_compressed_bytes = 0, 'dead', 'active') AS status
    FROM system.data_skipping_indices
    ORDER BY data_compressed_bytes DESC
    LIMIT 1000
  `,
  columns: [
    'database',
    'table',
    'name',
    'type',
    'expr',
    'granularity',
    'readable_compressed',
    'readable_uncompressed',
    'status',
  ],
  columnFormats: {
    database: 'colored-badge',
    table: 'colored-badge',
    type: 'colored-badge',
    expr: 'code',
    readable_compressed: 'background-bar',
    status: 'colored-badge',
  },
  rowStyle: {
    rules: [
      {
        when: { column: 'data_compressed_bytes', op: 'falsy' },
        className: 'opacity-60',
      },
    ],
    default: '',
  },
}
