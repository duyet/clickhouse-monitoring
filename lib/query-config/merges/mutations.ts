import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

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
        now() - create_time AS elapsed,
        parts_to_do,
        formatReadableQuantity(parts_to_do) AS readable_parts_to_do,
        round(100 * parts_to_do / nullIf(max(parts_to_do) OVER (), 0), 2) as pct_parts_to_do,
        parts_to_do_names,
        is_done,
        if(is_done = 0 AND parts_to_do > 0 AND (now() - create_time) > 600, 1, 0) AS is_stuck,
        latest_failed_part,
        latest_fail_time,
        latest_fail_reason
      FROM system.mutations
      ORDER BY is_done ASC, is_stuck DESC, create_time DESC
    `,
  columns: [
    'is_done',
    'is_stuck',
    'table',
    'mutation_id',
    'command',
    'create_time',
    'elapsed',
    'readable_parts_to_do',
    'latest_failed_part',
    'latest_fail_time',
    'latest_fail_reason',
  ],
  columnFormats: {
    table: ColumnFormat.ColoredBadge,
    command: ColumnFormat.CodeDialog,
    is_done: ColumnFormat.Boolean,
    is_stuck: ColumnFormat.Boolean,
    elapsed: ColumnFormat.Duration,
    readable_parts_to_do: ColumnFormat.BackgroundBar,
  },
  rowClassName: (row) => {
    const isStuck = Number(row.is_stuck || 0)
    if (isStuck) return 'bg-red-50 dark:bg-red-950/20'
    const isDone = Number(row.is_done || 0)
    const elapsed = Number(row.elapsed || 0)
    if (!isDone && elapsed > 300) return 'bg-amber-50 dark:bg-amber-950/20'
    return ''
  },
  relatedCharts: [
    [
      'summary-stuck-mutations',
      {
        title: 'Stuck Mutations',
      },
    ],
    [
      'summary-used-by-mutations',
      {
        title: 'Mutations Summary',
      },
    ],
    [
      'merge-count',
      {
        title: 'Merge/Mutations',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
  ],
}
