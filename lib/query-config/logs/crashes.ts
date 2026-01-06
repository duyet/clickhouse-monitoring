import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const crashLogConfig: QueryConfig = {
  name: 'crash-log',
  description: 'Server crash history and details',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/crash_log',
  optional: true,
  tableCheck: 'system.crash_log',
  sql: `
    SELECT
      event_time,
      signal,
      thread_id,
      query_id,
      arrayStringConcat(trace, '\\n') as trace_summary,
      arrayStringConcat(trace_full, '\\n') as trace_full,
      version,
      revision,
      build_id
    FROM system.crash_log
    ORDER BY event_time DESC
    LIMIT 100
  `,
  columns: [
    'event_time',
    'signal',
    'thread_id',
    'query_id',
    'version',
    'revision',
    'trace_summary',
  ],
  columnFormats: {
    event_time: ColumnFormat.RelatedTime,
    signal: ColumnFormat.ColoredBadge,
    thread_id: ColumnFormat.Number,
    query_id: [
      ColumnFormat.Link,
      {
        href: '/query?query_id=[query_id]&host=[ctx.hostId]',
        className: 'max-w-24 truncate',
      },
    ],
    trace_summary: [
      ColumnFormat.CodeDialog,
      { max_truncate: 40, dialog_title: 'Crash Trace' },
    ],
    version: ColumnFormat.Text,
    revision: ColumnFormat.Number,
  },
  relatedCharts: ['crash-frequency'],
}
