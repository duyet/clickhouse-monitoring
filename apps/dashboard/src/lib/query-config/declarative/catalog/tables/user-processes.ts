import type { DeclarativeQueryConfig } from '../../schema'

export const userProcessesDeclarative: DeclarativeQueryConfig = {
  name: 'user-processes',
  defaultView: 'auto',
  card: { primary: 'user' },
  description: 'Per-user memory usage and resource summary',
  refreshInterval: 30_000,
  optional: true,
  tableCheck: 'system.user_processes',
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
    user: 'colored-badge',
    readable_memory_usage: 'background-bar',
  },
  sortingFns: {
    readable_memory_usage: 'sort_column_using_actual_value',
    readable_peak_memory_usage: 'sort_column_using_actual_value',
  },
}
