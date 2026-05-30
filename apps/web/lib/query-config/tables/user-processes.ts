import type { QueryConfig } from '@/types/query-config'

export const userProcessesConfig: QueryConfig = {
  name: 'user-processes',
  description: 'Per-user memory usage and resource summary',
  refreshInterval: 30_000,
  // system.user_processes may not exist on every server / version
  optional: true,
  tableCheck: 'system.user_processes',
  sql: `SELECT user, formatReadableSize(memory_usage) AS readable_memory, formatReadableSize(peak_memory_usage) AS readable_peak_memory, memory_usage, peak_memory_usage FROM system.user_processes ORDER BY memory_usage DESC`,
  columns: [
    'user',
    'readable_memory',
    'readable_peak_memory',
    'memory_usage',
    'peak_memory_usage',
  ],
}
