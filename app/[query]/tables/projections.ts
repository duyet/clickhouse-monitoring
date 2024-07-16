import { ColumnFormat } from '@/lib/types/column-format'
import { type QueryConfig } from '@/lib/types/query-config'

export const projectionsConfig: QueryConfig = {
  name: 'projections',
  description: `Projection size. https://clickhouse.com/docs/en/sql-reference/statements/alter/projection`,
  sql: `
      SELECT
          database,
          table,
          name,
          (sum(data_compressed_bytes) AS size) AS compressed,
          (sum(data_uncompressed_bytes) AS usize) AS uncompressed,
          formatReadableSize(compressed) AS readable_compressed,
          formatReadableSize(uncompressed) AS readable_uncompressed,
          round(100 * compressed / max(compressed) OVER ()) AS pct_compressed,
          round(100 * uncompressed / max(uncompressed) OVER ()) AS pct_uncompressed,
          round(uncompressed / compressed, 2) AS compr_rate,
          round(100 * compr_rate / max(compr_rate) OVER ()) AS pct_compr_rate,
          sum(rows) AS rows,
          formatReadableQuantity(rows) AS readable_rows,
          round(100 * rows / max(rows) OVER ()) AS pct_rows,
          count() AS part_count,
          round(100 * part_count / max(part_count) OVER ()) AS pct_part_count
      FROM system.projection_parts
      WHERE active
      GROUP BY
          database,
          table,
          name
      ORDER BY compressed DESC
  `,
  columns: [
    'database',
    'table',
    'name',
    'readable_compressed',
    'readable_uncompressed',
    'compr_rate',
    'readable_rows',
    'part_count',
  ],
  columnFormats: {
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    compr_rate: ColumnFormat.BackgroundBar,
    readable_rows: ColumnFormat.BackgroundBar,
    part_count: ColumnFormat.BackgroundBar,
  },
  defaultParams: {
    table: 'default.default',
  },
  relatedCharts: [],
}
