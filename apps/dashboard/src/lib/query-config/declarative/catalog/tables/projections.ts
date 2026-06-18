import type { DeclarativeQueryConfig } from '../../schema'

export const projectionsDeclarative: DeclarativeQueryConfig = {
  name: 'projections',
  defaultView: 'auto',
  card: { primary: 'name' },
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
          round(100 * compressed / nullIf(max(compressed) OVER (), 0)) AS pct_compressed,
          round(100 * uncompressed / nullIf(max(uncompressed) OVER (), 0)) AS pct_uncompressed,
          round(uncompressed / nullIf(compressed, 0), 2) AS compr_rate,
          round(100 * compr_rate / nullIf(max(compr_rate) OVER (), 0)) AS pct_compr_rate,
          sum(rows) AS rows,
          formatReadableQuantity(rows) AS readable_rows,
          round(100 * rows / nullIf(max(rows) OVER (), 0)) AS pct_rows,
          count() AS part_count,
          round(100 * part_count / nullIf(max(part_count) OVER (), 0)) AS pct_part_count
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
    readable_compressed: 'background-bar',
    readable_uncompressed: 'background-bar',
    compr_rate: 'background-bar',
    readable_rows: 'background-bar',
    part_count: 'background-bar',
  },
  optional: false,
  defaultParams: {
    table: 'default.default',
  },
  relatedCharts: [],
}
