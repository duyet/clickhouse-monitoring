import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const userProcessesConfig: QueryConfig = {
  name: 'user-processes',
  description: 'Per-user memory usage and resource summary',
  refreshInterval: 30_000,
  // system.user_processes may not exist on every server / version
  optional: true,
  tableCheck: 'system.user_processes',
  // BackgroundBar requires base + readable_{column} + pct_{column}
  sql: `
    SELECT
      user,
      memory_usage,
      formatReadableSize(memory_usage) AS readable_memory_usage,
      round(memory_usage * 100.0 / nullIf(max(memory_usage) OVER (), 0), 2) AS pct_memory_usage,
      peak_memory_usage,
      formatReadableSize(peak_memory_usage) AS readable_peak_memory_usage
    FROM system.user_processes
    ORDER BY memory_usage DESC
  `,
  columns: ['user', 'readable_memory_usage', 'readable_peak_memory_usage'],
  columnFormats: {
    user: ColumnFormat.ColoredBadge,
    readable_memory_usage: ColumnFormat.BackgroundBar,
    // readable_peak_memory_usage is already a human-readable string from
    // formatReadableSize() in SQL, rendered as plain text
  },
  sortingFns: {
    readable_memory_usage: 'sort_column_using_actual_value',
    readable_peak_memory_usage: 'sort_column_using_actual_value',
  },
}
