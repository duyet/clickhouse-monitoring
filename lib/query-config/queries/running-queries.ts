import type { QueryConfig } from '@/types/query-config'

import { QUERY_COMMENT } from '@/lib/clickhouse/constants'
import { ColumnFormat } from '@/types/column-format'

function buildRunningQueriesSql({
  includeNormalizedQueryHash,
}: {
  includeNormalizedQueryHash: boolean
}): string {
  return `
    ${QUERY_COMMENT}
    SELECT
      query_id,
      query,
      query_kind,
      user,
      current_database,
      initial_query_id,
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
      ${
        includeNormalizedQueryHash
          ? 'normalized_query_hash'
          : 'NULL AS normalized_query_hash'
      },
      query_id AS action,
      multiIf (elapsed < 30, format('{} seconds', round(elapsed, 1)),
               elapsed < 90, 'a minute',
               formatReadableTimeDelta(elapsed, 'days', 'minutes')) AS readable_elapsed,
      formatReadableQuantity(read_rows) AS readable_read_rows,
      formatReadableSize(read_bytes) AS readable_read_bytes,
      formatReadableQuantity(written_rows) AS readable_written_rows,
      formatReadableSize(written_bytes) AS readable_written_bytes,
      formatReadableSize(peak_memory_usage) AS readable_peak_memory_usage,
      multiIf (
        memory_usage = 0, formatReadableSize(memory_usage),
        formatReadableSize(memory_usage) = formatReadableSize(peak_memory_usage), formatReadableSize(memory_usage),
        formatReadableSize(memory_usage) || ' (peak ' || readable_peak_memory_usage || ')'
      ) AS readable_memory_usage,
      if(total_rows_approx > 0 AND query_kind = 'Select', toString(round((100 * read_rows) / total_rows_approx, 2)) || '%', '') AS progress,
      formatReadableQuantity(ProfileEvents['Merge']) AS launched_merges,
      length(thread_ids) AS thread_count,
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
  `
}

export const runningQueriesConfig: QueryConfig = {
  name: 'running-queries',
  refreshInterval: 30_000,
  sql: [
    {
      since: '23.8',
      description: 'Base system.processes projection',
      sql: buildRunningQueriesSql({ includeNormalizedQueryHash: false }),
    },
    {
      since: '25.3',
      description: 'Includes normalized_query_hash from system.processes',
      sql: buildRunningQueriesSql({ includeNormalizedQueryHash: true }),
    },
  ],
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
