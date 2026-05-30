import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const queryMetricLogConfig: QueryConfig = {
  name: 'query-metric-log',
  description:
    'Per-query resource usage sampled over each query lifetime from system.query_metric_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/query_metric_log',
  refreshInterval: 30_000,
  // system.query_metric_log is opt-in and may not exist on every server / version
  optional: true,
  tableCheck: 'system.query_metric_log',
  sql: `
      SELECT
        query_id,
        event_time,
        memory_usage,
        formatReadableSize(memory_usage) AS readable_memory,
        round(memory_usage * 100.0 / nullIf(max(memory_usage) OVER (), 0), 2) AS pct_readable_memory,
        peak_memory_usage,
        formatReadableSize(peak_memory_usage) AS readable_peak_memory,
        round(peak_memory_usage * 100.0 / nullIf(max(peak_memory_usage) OVER (), 0), 2) AS pct_readable_peak_memory,
        ProfileEvent_SelectedRows AS selected_rows,
        ProfileEvent_RealTimeMicroseconds AS real_time_us,
        ProfileEvent_OSCPUVirtualTimeMicroseconds AS cpu_time_us
      FROM system.query_metric_log
      ORDER BY event_time DESC
      LIMIT 1000
    `,
  columns: [
    'query_id',
    'event_time',
    'readable_memory',
    'readable_peak_memory',
    'selected_rows',
    'real_time_us',
    'cpu_time_us',
  ],
  columnFormats: {
    query_id: ColumnFormat.ColoredBadge,
    readable_memory: ColumnFormat.BackgroundBar,
    readable_peak_memory: ColumnFormat.BackgroundBar,
    selected_rows: ColumnFormat.NumberShort,
    real_time_us: ColumnFormat.NumberShort,
    cpu_time_us: ColumnFormat.NumberShort,
  },
}
