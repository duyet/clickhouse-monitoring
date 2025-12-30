import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

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

export const databaseTableColumnsConfig: QueryConfig = {
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

export const tablesListConfig: QueryConfig = {
  name: 'tables-list',
  description: 'List of tables in a database',
  sql: `
    SELECT
        database,
        table,
        engine,
        sum(bytes_on_disk) as compressed,
        formatReadableSize(compressed) as readable_compressed,
        sum(data_uncompressed_bytes) as uncompressed,
        formatReadableSize(uncompressed) as readable_uncompressed,
        round(compressed / uncompressed, 2) as compr_rate,
        sum(rows) as total_rows,
        formatReadableQuantity(total_rows) as readable_total_rows,
        sum(bytes_on_disk) / sum(rows) as avg_part_size,
        formatReadableSize(avg_part_size) as readable_avg_part_size,
        count() as parts_count,
        countIf(detached = 1) as detached_parts_count,
        sum(detached_bytes_on_disk) as detached_bytes_on_disk,
        formatReadableSize(detached_bytes_on_disk) as readable_detached_bytes_on_disk,
        max(comment) as comment
    FROM system.parts
    WHERE active
        AND database = {database:String}
    GROUP BY database, table, engine
    ORDER BY compressed DESC
  `,
  columns: [
    'table',
    'engine',
    'readable_compressed',
    'readable_uncompressed',
    'compr_rate',
    'readable_total_rows',
    'readable_avg_part_size',
    'parts_count',
    'detached_parts_count',
    'readable_detached_bytes_on_disk',
    'comment',
    'action',
  ],
  columnFormats: {
    parts_count: ColumnFormat.Number,
    detached_parts_count: ColumnFormat.Link,
    table: [
      ColumnFormat.Link,
      {
        href: `/table?host=[ctx.hostId]&database=[ctx.database]&table=[table]`,
        className: 'truncate max-w-48',
      },
    ],
    engine: [ColumnFormat.ColoredBadge, { className: 'truncate max-w-40' }],
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    readable_total_rows: ColumnFormat.BackgroundBar,
    readable_avg_part_size: ColumnFormat.BackgroundBar,
    compr_rate: ColumnFormat.BackgroundBar,
    comment: [
      ColumnFormat.Text,
      {
        className: 'line-clamp-1	hover:text-nowrap',
      },
    ],
    action: [ColumnFormat.Action, ['optimize']],
  },
  defaultParams: {
    database: '',
  },
}
