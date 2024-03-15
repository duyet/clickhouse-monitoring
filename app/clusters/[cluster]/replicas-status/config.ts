import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const config: QueryConfig = {
  name: 'count-across-replicas',
  description: 'Count across replicas for all tables in the cluster',
  sql: `
      SELECT
          hostName() AS host,

          sum(rows) AS total_rows,
          formatReadableQuantity(total_rows) AS readable_total_rows,
          (100 * total_rows / max(total_rows) OVER ()) AS pct_total_rows,

          sum(bytes) AS total_bytes,
          formatReadableSize(sum(bytes)) AS readable_total_bytes,
          (100 * total_bytes / max(total_bytes) OVER ()) AS pct_total_bytes,

          count() as part_count,
          (100 * count() / max(count()) OVER ()) AS pct_part_count,

          sum(primary_key_size) AS primary_key_size,
          formatReadableSize(primary_key_size) AS readable_primary_key_size,
          (100 * primary_key_size / max(primary_key_size) OVER ()) AS pct_primary_key_size,

          sum(marks_bytes) AS marks_bytes,
          formatReadableSize(marks_bytes) AS readable_marks_bytes,
          (100 * marks_bytes / max(marks_bytes) OVER ()) AS pct_marks_bytes,

          max(modification_time) AS last_modification_time

      FROM clusterAllReplicas({cluster: String}, system.parts)
      WHERE active
      GROUP BY 1
      ORDER BY
          1 ASC,
          2 DESC
  `,
  columns: [
    'host',
    'readable_total_rows',
    'readable_total_bytes',
    'readable_primary_key_size',
    'readable_marks_bytes',
    'part_count',
    'last_modification_time',
  ],
  columnFormats: {
    readable_total_rows: ColumnFormat.BackgroundBar,
    readable_total_bytes: ColumnFormat.BackgroundBar,
    readable_primary_key_size: ColumnFormat.BackgroundBar,
    readable_marks_bytes: ColumnFormat.BackgroundBar,
    part_count: ColumnFormat.BackgroundBar,
  },
}
