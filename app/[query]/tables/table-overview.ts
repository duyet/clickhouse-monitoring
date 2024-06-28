import { ColumnFormat } from '@/lib/types/column-format'
import { type QueryConfig } from '@/lib/types/query-config'

export const tablesOverviewConfig: QueryConfig = {
  name: 'tables-overview',
  sql: `
      SELECT
          format('{}.{}', database, table) AS table,
          sum(rows) AS rows,
          max(modification_time) AS latest_modification,
          formatReadableSize(sum(bytes)) AS data_size,
          formatReadableSize(sum(primary_key_bytes_in_memory)) AS primary_keys_size,
          any(engine) AS engine,
          sum(bytes) AS bytes_size
      FROM system.parts
      WHERE active
      GROUP BY 1
     ORDER BY bytes_size DESC
    `,
  columns: [
    'table',
    'rows',
    'data_size',
    'latest_modification',
    'primary_keys_size',
    'engine',
    'bytes_size',
  ],
  columnFormats: {
    engine: ColumnFormat.ColoredBadge,
  },
}
