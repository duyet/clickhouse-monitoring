import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'
import { listTables } from '../queries'

export const tablesListConfig: QueryConfig = {
  name: 'tables-list',
  description: 'List of tables in a database',
  sql: listTables,
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
        href: `/[ctx.hostId]/database/[ctx.database]/[table]`,
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
