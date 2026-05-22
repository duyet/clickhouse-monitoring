import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@/lib/clickhouse/constants'
import { ColumnFormat } from '@/types/column-format'

/**
 * Running queries from `system.processes`.
 *
 * Every field the card / summary formatter reads is selected here — earlier
 * revisions silently dropped `ProfileEvents`, `pct_progress` and the thread
 * count, which is why CPU rendered "0s" and the progress bar stuck at 0%.
 *
 * Version compatibility: this SELECT uses only columns and functions that are
 * stable across ClickHouse v24.x → v26.x. The peak-threads metric is derived
 * from `length(thread_ids)` rather than `system.processes.peak_threads_usage`
 * because that column does not exist before ~25.1 (absent in 24.5–24.12 per
 * `docs/clickhouse-schemas/tables/processes.md`); `thread_ids` is universal.
 */
export const runningQueriesConfig: QueryConfig = {
  name: 'running-queries',
  refreshInterval: 5_000,
  sql: `
    ${QUERY_COMMENT}
    SELECT
      query_id,
      query,
      query_kind,
      user,
      os_user,
      current_database,
      initial_query_id,
      is_initial_query,
      address,
      port,
      interface,
      client_name,
      client_hostname,
      distributed_depth,
      elapsed,
      read_rows,
      read_bytes,
      total_rows_approx,
      written_rows,
      written_bytes,
      memory_usage,
      peak_memory_usage,
      ProfileEvents,
      length(thread_ids) AS thread_count,
      query_id AS action,
      multiIf (elapsed < 30, format('{} seconds', round(elapsed, 1)),
               elapsed < 90, 'a minute',
               formatReadableTimeDelta(elapsed, 'days', 'minutes')) AS readable_elapsed,
      formatReadableQuantity(read_rows) AS readable_read_rows,
      formatReadableSize(read_bytes) AS readable_read_bytes,
      formatReadableQuantity(written_rows) AS readable_written_rows,
      formatReadableSize(written_bytes) AS readable_written_bytes,
      formatReadableQuantity(total_rows_approx) AS readable_total_rows_approx,
      formatReadableSize(peak_memory_usage) AS readable_peak_memory_usage,
      multiIf (
        memory_usage = 0, formatReadableSize(memory_usage),
        formatReadableSize(memory_usage) = formatReadableSize(peak_memory_usage), formatReadableSize(memory_usage),
        formatReadableSize(memory_usage) || ' (peak ' || readable_peak_memory_usage || ')'
      ) AS readable_memory_usage,
      if(total_rows_approx > 0 AND query_kind = 'Select', toString(round((100 * read_rows) / total_rows_approx, 2)) || '%', '') AS progress,
      if(total_rows_approx > 0 AND query_kind = 'Select', least(100., round((100 * read_rows) / total_rows_approx, 1)), 0.) AS pct_progress,
      if(total_rows_approx > 0 AND read_rows > 0 AND read_rows < total_rows_approx AND query_kind = 'Select',
         round(elapsed * (total_rows_approx - read_rows) / read_rows, 1), NULL) AS estimated_remaining_time,
      formatReadableQuantity(ProfileEvents['Merge']) AS launched_merges,
      multiIf(interface = 1, 'TCP',
              interface = 2, 'HTTP',
              interface = 3, 'gRPC',
              interface = 4, 'MySQL',
              interface = 5, 'PostgreSQL',
              interface = 6, 'Local',
              interface = 7, 'Interserver',
              toString(interface)) AS interface_label
    FROM system.processes
    WHERE is_cancelled = 0
    ORDER BY elapsed DESC
  `,
  columns: ['action', 'query'],
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
    query: ColumnFormat.RunningQuerySummary,
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
