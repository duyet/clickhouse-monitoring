import type { DeclarativeQueryConfig } from '../../schema'

export const queryMetricLogDeclarative: DeclarativeQueryConfig = {
  name: 'query-metric-log',
  description:
    'Per-query resource usage sampled over each query lifetime from system.query_metric_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/query_metric_log',
  refreshInterval: 30_000,
  // system.query_metric_log is opt-in and may not exist on every server / version
  optional: true,
  tableCheck: 'system.query_metric_log',
  // Pre-aggregate one row per query over the last hour instead of returning
  // every raw per-interval sample. system.query_metric_log is high-cardinality
  // (one row per query per sampling interval), so a raw SELECT can scan enough
  // data to exceed Cloudflare Worker CPU/memory limits (HTTP 503). Aggregating
  // server-side and bounding the time window keeps the result small and useful.
  sql: `
      WITH per_query AS (
        SELECT
          query_id,
          -- NOT "AS event_time": the new ClickHouse analyzer resolves the WHERE
          -- column to this aggregate alias (it shadows the raw column) and rejects
          -- "aggregate function in WHERE". Use a distinct name, re-alias below.
          max(event_time) AS last_event_time,
          max(memory_usage) AS memory_usage,
          max(peak_memory_usage) AS peak_memory_usage,
          max(ProfileEvent_SelectedRows) AS selected_rows,
          max(ProfileEvent_RealTimeMicroseconds) AS real_time_us,
          max(ProfileEvent_OSCPUVirtualTimeMicroseconds) AS cpu_time_us
        FROM system.query_metric_log
        WHERE event_time >= now() - INTERVAL 1 HOUR
        GROUP BY query_id
      )
      SELECT
        query_id,
        last_event_time AS event_time,
        formatReadableSize(memory_usage) AS readable_memory,
        round(memory_usage * 100.0 / nullIf(max(memory_usage) OVER (), 0), 2) AS pct_readable_memory,
        formatReadableSize(peak_memory_usage) AS readable_peak_memory,
        round(peak_memory_usage * 100.0 / nullIf(max(peak_memory_usage) OVER (), 0), 2) AS pct_readable_peak_memory,
        selected_rows,
        real_time_us,
        cpu_time_us
      FROM per_query
      ORDER BY event_time DESC
      LIMIT 100
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
    query_id: 'colored-badge',
    readable_memory: 'background-bar',
    readable_peak_memory: 'background-bar',
    selected_rows: 'number-short',
    real_time_us: 'number-short',
    cpu_time_us: 'number-short',
  },
}
