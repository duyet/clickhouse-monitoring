import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const queryViewsLogConfig: QueryConfig = {
  name: 'query-views-log',
  description:
    'Materialized view execution log (target views, durations, read/written rows) with compatibility for old and new ClickHouse releases.',
  optional: true,
  tableCheck: 'system.query_views_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/query_views_log',
  sql: [
    {
      since: '22.8',
      sql: `
        SELECT
          event_time,
          initial_query_id,
          view_name,
          status,
          exception_code,
          exception,
          round(view_duration_ms, 2) AS view_duration_ms,
          read_rows,
          formatReadableQuantity(read_rows) AS readable_read_rows,
          written_rows,
          formatReadableQuantity(written_rows) AS readable_written_rows
        FROM system.query_views_log
        WHERE event_date >= today() - 7
        ORDER BY event_time DESC
        LIMIT 1000
      `,
    },
    {
      since: '23.2',
      sql: `
        SELECT
          event_time,
          initial_query_id,
          view_name,
          view_uuid,
          status,
          exception_code,
          exception,
          view_type,
          round(view_duration_ms, 2) AS view_duration_ms,
          read_rows,
          formatReadableQuantity(read_rows) AS readable_read_rows,
          written_rows,
          formatReadableQuantity(written_rows) AS readable_written_rows,
          memory_usage,
          formatReadableSize(memory_usage) AS readable_memory_usage
        FROM system.query_views_log
        WHERE event_date >= today() - 7
        ORDER BY event_time DESC
        LIMIT 1000
      `,
    },
  ],
  columns: [
    'event_time',
    'initial_query_id',
    'view_name',
    'status',
    'view_duration_ms',
    'readable_read_rows',
    'readable_written_rows',
    'exception_code',
    'exception',
  ],
  columnFormats: {
    event_time: ColumnFormat.RelatedTime,
    initial_query_id: [
      ColumnFormat.Link,
      { href: '/query?host=[ctx.hostId]&query_id=[initial_query_id]' },
    ],
    view_name: ColumnFormat.ColoredBadge,
    status: ColumnFormat.ColoredBadge,
    view_duration_ms: ColumnFormat.Number,
    readable_read_rows: ColumnFormat.BackgroundBar,
    readable_written_rows: ColumnFormat.BackgroundBar,
    exception_code: ColumnFormat.Number,
    exception: ColumnFormat.Text,
  },
  relatedCharts: ['query-duration-trend', 'top-query-fingerprints-perf'],
}
