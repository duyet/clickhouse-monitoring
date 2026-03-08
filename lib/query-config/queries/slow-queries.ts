import type { QueryConfig, VersionedSql } from '@/types/query-config'

import { QUERY_LOG } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'

export const slowQueriesConfig: QueryConfig = {
  name: 'slow-queries',
  description: 'Top 10 slowest queries with query_duration_ms >= 5000',
  docs: QUERY_LOG,
  tableCheck: 'system.query_log',
  defaultParams: {
    min_duration_s: '5',
    user: '',
    last_hours: '24',
  },
  filterParamPresets: [
    {
      name: 'Last 1 hour',
      key: 'last_hours',
      value: '1',
    },
    {
      name: 'Last 6 hours',
      key: 'last_hours',
      value: '6',
    },
    {
      name: 'Last 24 hours',
      key: 'last_hours',
      value: '24',
    },
    {
      name: 'Last 7 days',
      key: 'last_hours',
      value: '168',
    },
    {
      name: '> 5s',
      key: 'min_duration_s',
      value: '5',
    },
    {
      name: '> 30s',
      key: 'min_duration_s',
      value: '30',
    },
    {
      name: '> 60s',
      key: 'min_duration_s',
      value: '60',
    },
  ],
  sql: [
    {
      since: '23.8',
      description: 'Base query without query_cache_usage',
      sql: `
        SELECT
            query_id,
            query_start_time,
            query_duration_ms,
            query_duration_ms / 1000 AS query_duration,
            user,
            replace(substr(query, 1, 500), '\n', ' ') AS query,
            read_rows,
            formatReadableQuantity(read_rows) AS readable_read_rows,
            round(read_rows * 100.0 / nullIf(max(read_rows) OVER (), 0), 2) AS pct_read_rows,
            read_bytes,
            formatReadableSize(read_bytes) AS readable_read_bytes,
            round(read_bytes * 100.0 / nullIf(max(read_bytes) OVER (), 0), 2) AS pct_read_bytes,
            memory_usage,
            formatReadableSize(memory_usage) AS readable_memory_usage,
            round(memory_usage * 100.0 / nullIf(max(memory_usage) OVER (), 0), 2) AS pct_memory_usage
        FROM system.query_log
        WHERE type = 'QueryFinish'
            AND query_duration_ms >= {min_duration_s:UInt64} * 1000
            AND event_time > now() - interval {last_hours:UInt64} hour
            AND ({user:String} = '' OR user = {user:String})
        ORDER BY query_duration_ms DESC
        LIMIT 10
      `,
    },
    {
      since: '24.1',
      description: 'Added query_cache_usage column',
      sql: `
        SELECT
            query_id,
            query_start_time,
            query_duration_ms,
            query_duration_ms / 1000 AS query_duration,
            user,
            query_cache_usage,
            replace(substr(query, 1, 500), '\n', ' ') AS query,
            read_rows,
            formatReadableQuantity(read_rows) AS readable_read_rows,
            round(read_rows * 100.0 / nullIf(max(read_rows) OVER (), 0), 2) AS pct_read_rows,
            read_bytes,
            formatReadableSize(read_bytes) AS readable_read_bytes,
            round(read_bytes * 100.0 / nullIf(max(read_bytes) OVER (), 0), 2) AS pct_read_bytes,
            memory_usage,
            formatReadableSize(memory_usage) AS readable_memory_usage,
            round(memory_usage * 100.0 / nullIf(max(memory_usage) OVER (), 0), 2) AS pct_memory_usage
        FROM system.query_log
        WHERE type = 'QueryFinish'
            AND query_duration_ms >= {min_duration_s:UInt64} * 1000
            AND event_time > now() - interval {last_hours:UInt64} hour
            AND ({user:String} = '' OR user = {user:String})
        ORDER BY query_duration_ms DESC
        LIMIT 10
      `,
    },
  ] as VersionedSql[],
  rowClassName: (row) => {
    const durationS = Number(row.query_duration || 0)
    if (durationS > 60) return 'bg-red-50 dark:bg-red-950/20'
    if (durationS > 10) return 'bg-amber-50 dark:bg-amber-950/20'
    return undefined
  },
  columns: [
    'action',
    'query_id',
    'query_start_time',
    'query_duration',
    'user',
    'query_cache_usage',
    'query',
    'readable_read_rows',
    'readable_read_bytes',
    'readable_memory_usage',
  ],
  columnFormats: {
    action: [ColumnFormat.Action, ['explain-query', 'open-in-explorer']],
    query_id: [
      ColumnFormat.Link,
      {
        href: '/query?query_id=[query_id]&host=[ctx.hostId]',
        className: 'truncate max-w-48 text-wrap',
        title: 'Query Detail',
      },
    ],
    query_start_time: ColumnFormat.RelatedTime,
    query_duration: ColumnFormat.Duration,
    user: ColumnFormat.ColoredBadge,
    query_cache_usage: ColumnFormat.ColoredBadge,
    query: [
      ColumnFormat.CodeDialog,
      { max_truncate: 100, hide_query_comment: true },
    ],
    readable_read_rows: ColumnFormat.BackgroundBar,
    readable_read_bytes: ColumnFormat.BackgroundBar,
    readable_memory_usage: ColumnFormat.BackgroundBar,
  },
  relatedCharts: [['slow-query-occurrences', {}]],
}
