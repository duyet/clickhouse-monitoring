import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const mergesConfig: QueryConfig = {
  name: 'merges',
  description:
    'Merges and part mutations currently in process for tables in the MergeTree family',
  sql: `
      SELECT *,
        database || '.' || table as table,
        round(100 * num_parts / max(num_parts) OVER ()) as pct_num_parts,
        round(progress * 100, 1) as pct_progress,
        (cast(pct_progress, 'String') || '%') as readable_progress,
        round(100 * rows_read / max(rows_read) OVER ()) as pct_rows_read,
        formatReadableQuantity(rows_read) as readable_rows_read,
        round(100 * rows_written / max(rows_written) OVER ()) as pct_rows_written,
        formatReadableQuantity(rows_written) as readable_rows_written,
        round(100 * memory_usage / max(memory_usage) OVER ()) as pct_memory_usage,
        formatReadableSize(memory_usage) as readable_memory_usage
      FROM system.merges
      ORDER BY progress DESC
    `,
  columns: [
    'table',
    'partition_id',
    'elapsed',
    'readable_progress',
    'num_parts',
    'readable_rows_read',
    'readable_rows_written',
    'readable_memory_usage',
    'is_mutation',
    'merge_type',
    'merge_algorithm',
  ],
  columnFormats: {
    table: ColumnFormat.ColoredBadge,
    query: ColumnFormat.Code,
    elapsed: ColumnFormat.Duration,
    is_mutation: ColumnFormat.Boolean,
    num_parts: ColumnFormat.BackgroundBar,
    readable_progress: ColumnFormat.BackgroundBar,
    readable_memory_usage: ColumnFormat.BackgroundBar,
    readable_rows_read: ColumnFormat.BackgroundBar,
    readable_rows_written: ColumnFormat.BackgroundBar,
  },
  relatedCharts: [
    [
      'summary-used-by-merges',
      {
        title: 'Merge Summary',
      },
    ],
    [
      'merge-count',
      {
        title: 'Merge/Mutations over last 12 hours (avg / 5 minutes)',
        interval: 'toStartOfFiveMinutes',
        lastHours: 12,
      },
    ],
  ],
}
