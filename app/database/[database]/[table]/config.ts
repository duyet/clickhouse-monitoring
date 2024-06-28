import { ColumnFormat } from '@/lib/types/column-format'
import { type QueryConfig } from '@/lib/types/query-config'

export type Row = {
  column: string
  type: string
  readable_compressed: string
  readable_uncompressed: string
  compr_ratio: number
  readable_rows_cnt: string
  avg_row_size: number
  codec: string
  comment: string
}

export const config: QueryConfig = {
  name: 'columns',
  sql: `
    WITH columns AS (
      SELECT database,
             table,
             name as column,
             compression_codec as codec,
             (default_kind || ' ' || default_expression) as default_expression,
             comment
      FROM system.columns
      WHERE (database = {database: String})
        AND (table = {table: String})
    ),
    summary AS (
      SELECT database,
             table,
             column,
             type,
             sum(column_data_compressed_bytes) as compressed,
             sum(column_data_uncompressed_bytes) AS uncompressed,
             formatReadableSize(compressed) AS readable_compressed,
             formatReadableSize(uncompressed) AS readable_uncompressed,
             round(uncompressed / compressed, 2) AS compr_ratio,
             sum(rows) AS rows_cnt,
             formatReadableQuantity(rows_cnt) AS readable_rows_cnt,
             round(uncompressed / rows_cnt, 2) avg_row_size,
             round(100 * compressed / max(compressed) OVER ()) AS pct_compressed,
             round(100 * uncompressed / max(uncompressed) OVER()) AS pct_uncompressed,
             round(100 * rows_cnt / max(rows_cnt) OVER ()) AS pct_rows_cnt,
             round(100 * compr_ratio / max(compr_ratio) OVER ()) AS pct_compr_ratio
      FROM system.parts_columns
      WHERE (active = 1)
        AND (database = {database: String})
        AND (table = {table: String})
      GROUP BY database,
               table,
               column,
               type
      ORDER BY compressed DESC
    )
    SELECT s.*, c.codec, c.default_expression, c.comment
    FROM summary s
    LEFT OUTER JOIN columns c USING (database, table, column)
  `,
  columns: [
    'column',
    'type',
    'readable_compressed',
    'readable_uncompressed',
    'compr_ratio',
    'readable_rows_cnt',
    'avg_row_size',
    'codec',
    'comment',
  ],
  columnFormats: {
    column: [ColumnFormat.HoverCard, { content: 'Column comment: [comment]' }],
    type: ColumnFormat.Code,
    codec: ColumnFormat.Code,
    part_count: ColumnFormat.Number,
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    compr_ratio: ColumnFormat.BackgroundBar,
    readable_rows_cnt: ColumnFormat.BackgroundBar,
    default_expression: ColumnFormat.Code,
  },
}
