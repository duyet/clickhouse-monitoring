import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const runningQueriesConfig: QueryConfig = {
  name: 'running-queries',
  sql: `
    SELECT *,
      query_id as query_detail,
      multiIf (elapsed < 30, format('{} seconds', round(elapsed, 1)),
               elapsed < 90, 'a minute',
               formatReadableTimeDelta(elapsed, 'days', 'minutes')) as readable_elapsed,
      round(100 * elapsed / nullIf(max(elapsed) OVER (), 0)) AS pct_elapsed,
      formatReadableQuantity(read_rows) as readable_read_rows,
      round(100 * read_rows / nullIf(max(read_rows) OVER (), 0)) AS pct_read_rows,
      formatReadableQuantity(written_rows) as readable_written_rows,
      round(100 * written_rows / nullIf(max(written_rows) OVER (), 0)) AS pct_written_rows,
      formatReadableQuantity(total_rows_approx) as readable_total_rows_approx,
      formatReadableSize(peak_memory_usage) as readable_peak_memory_usage,
      multiIf (
        memory_usage = 0, formatReadableSize(memory_usage),
        formatReadableSize(memory_usage) = formatReadableSize(peak_memory_usage), formatReadableSize(memory_usage),
        formatReadableSize(memory_usage) || ' (peak ' || readable_peak_memory_usage || ')'
      ) as readable_memory_usage,
      round(100 * memory_usage / nullIf(max(memory_usage) OVER (), 0)) AS pct_memory_usage,
      if(total_rows_approx > 0 AND query_kind = 'Select', toString(round((100 * read_rows) / total_rows_approx, 2)) || '%', '') AS progress,
      if(total_rows_approx > 0 AND query_kind = 'Select', round((100 * read_rows) / total_rows_approx, 2), 0) AS pct_progress,
      if(total_rows_approx > 0 AND read_rows > 0, (elapsed / (read_rows / total_rows_approx)) * (1 - (read_rows / total_rows_approx)), NULL) AS estimated_remaining_time,
      formatReadableQuantity(ProfileEvents['Merge']) AS launched_merges,
      formatReadableQuantity(ProfileEvents['MergedRows']) AS rows_before_merge,
      formatReadableSize(ProfileEvents['MergedUncompressedBytes']) AS bytes_before_merge,
      formatReadableTimeDelta(ProfileEvents['MergesTimeMilliseconds'] / 1000, 'days', 'minutes') AS merges_time,
      formatReadableTimeDelta(ProfileEvents['PartsLockHoldMicroseconds'] / 1000 / 1000) AS parts_lock_hold,
      ProfileEvents['FileOpen'] AS file_open,
      ProfileEvents['ContextLock'] AS context_lock,
      ProfileEvents['RWLockAcquiredReadLocks'] AS rw_lock_acquired_read_locks
    FROM system.processes
    WHERE is_cancelled = 0
    ORDER BY elapsed
  `,
  columns: [
    'action',
    'query',
    'query_detail',
    'user',
    'readable_memory_usage',
    'readable_elapsed',
    'progress',
    'readable_read_rows',
    'readable_written_rows',
    'launched_merges',
    'rows_before_merge',
    'bytes_before_merge',
    'merges_time',
    'file_open',
    'parts_lock_hold',
    'context_lock',
    'rw_lock_acquired_read_locks',
  ],
  rowClassName: (row) => {
    // elapsed is in seconds for running queries
    const elapsed = Number(row.elapsed || 0)
    if (elapsed > 30) return 'bg-red-50 dark:bg-red-950/20'
    if (elapsed > 5) return 'bg-amber-50 dark:bg-amber-950/20'
    return undefined
  },

  // Bulk actions for selected rows (shown in toolbar)
  bulkActions: ['kill-query'],
  columnFormats: {
    action: [
      ColumnFormat.InlineAction,
      ['kill-query', 'analyze-with-ai', 'open-in-explorer'],
    ],
    query: [
      ColumnFormat.CodeDialog,
      {
        max_truncate: 40,
        hide_query_comment: true,
        dialog_title: 'Running Query',
      },
    ],
    query_detail: [
      ColumnFormat.Link,
      {
        href: '/query?query_id=[query_id]&host=[ctx.hostId]',
        className: 'max-w-32 truncate',
        title: 'Query Detail',
      },
    ],
    user: ColumnFormat.ColoredBadge,
    estimated_remaining_time: ColumnFormat.Duration,
    readable_elapsed: ColumnFormat.BackgroundBar,
    readable_read_rows: ColumnFormat.BackgroundBar,
    readable_written_rows: ColumnFormat.BackgroundBar,
    readable_memory_usage: ColumnFormat.BackgroundBar,
    progress: ColumnFormat.BackgroundBar,
    file_open: ColumnFormat.Number,
  },
  relatedCharts: [
    [
      'query-count',
      {
        title: 'Running Queries',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
        colSpan: 7,
      },
    ],
    [
      'summary-used-by-running-queries',
      {
        title: 'Running Queries Summary',
        colSpan: 3,
      },
    ],
    [
      'query-count-by-user',
      {
        title: 'Queries by User',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
        showLegend: false,
        colSpan: 7,
      },
    ],
    [
      'summary-used-by-merges',
      {
        title: 'Merge Summary',
        colSpan: 3,
      },
    ],
  ],
}
