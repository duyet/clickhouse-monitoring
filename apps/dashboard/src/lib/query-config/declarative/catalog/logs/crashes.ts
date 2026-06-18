import type { DeclarativeQueryConfig } from '../../schema'

export const crashLogDeclarative: DeclarativeQueryConfig = {
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
      version,
      revision
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
    event_time: 'related-time',
    signal: 'colored-badge',
    thread_id: 'number',
    query_id: [
      'link',
      {
        href: '/query?query_id=[query_id]&host=[ctx.hostId]',
        className: 'max-w-24 truncate',
      },
    ],
    trace_summary: [
      'code-dialog',
      { max_truncate: 40, dialog_title: 'Crash Trace' },
    ],
    version: 'text',
    revision: 'number',
  },
  relatedCharts: ['crash-frequency'],
}
