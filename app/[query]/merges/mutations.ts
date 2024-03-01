import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const mutationsConfig: QueryConfig = {
  name: 'mutations',
  description:
    'Information about mutations of MergeTree tables and their progress',
  sql: `
      SELECT
        database || '.' || table as table,
        mutation_id,
        command,
        create_time,
        formatReadableQuantity(parts_to_do) AS readable_parts_to_do,
        round(100 * parts_to_do / max(parts_to_do) OVER ()) as pct_parts_to_do,
        parts_to_do_names,
        is_done,
        latest_failed_part,
        latest_fail_time,
        latest_fail_reason
      FROM system.mutations
      ORDER BY is_done ASC, create_time DESC
    `,
  columns: [
    'is_done',
    'table',
    'mutation_id',
    'command',
    'create_time',
    'readable_parts_to_do',
    'latest_failed_part',
    'latest_fail_time',
    'latest_fail_reason',
  ],
  columnFormats: {
    table: ColumnFormat.ColoredBadge,
    command: ColumnFormat.Code,
    is_done: ColumnFormat.Boolean,
    readable_parts_to_do: ColumnFormat.BackgroundBar,
  },
  relatedCharts: [
    [
      'summary-used-by-mutations',
      {
        title: 'Mutations Summary',
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
