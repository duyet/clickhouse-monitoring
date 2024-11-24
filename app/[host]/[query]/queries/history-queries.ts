import { QUERY_LOG } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const historyQueriesConfig: QueryConfig = {
  name: 'history-queries',
  description:
    'Contains information about executed queries: start time, duration of processing, error messages',
  docs: QUERY_LOG,
  sql: `
      SELECT
          type,
          query_id,
          query_duration_ms,
          query_duration_ms / 1000 as query_duration,
          event_time,
          query,
          formatted_query AS readable_query,
          user,
          read_rows,
          formatReadableQuantity(read_rows) AS readable_read_rows,
          round(100 * read_rows / MAX(read_rows) OVER ()) AS pct_read_rows,
          written_rows,
          formatReadableQuantity(written_rows) AS readable_written_rows,
          round(100 * written_rows / MAX(written_rows) OVER ()) AS pct_written_rows,
          result_rows,
          formatReadableQuantity(result_rows) AS readable_result_rows,
          memory_usage,
          formatReadableSize(memory_usage) AS readable_memory_usage,
          round(100 * memory_usage / MAX(memory_usage) OVER ()) AS pct_memory_usage,
          query_kind,
          client_name
      FROM system.query_log
      WHERE
        if ({type: String} != '', type = {type: String}, type != 'QueryStart')
        AND if ({duration_1m: String} = '1', query_duration >= 60, true)
        AND if (notEmpty({event_time: String}), toDate(event_time) = {event_time: String}, true)
        AND if ({database: String} != '' AND {table: String} != '', has(tables, format('{}.{}', {database: String}, {table: String})), true)
        AND if ({user: String} != '', user = {user: String}, true)
      ORDER BY event_time DESC
      LIMIT 1000
  `,

  columns: [
    'user',
    'query',
    'query_duration',
    'readable_memory_usage',
    'event_time',
    'readable_read_rows',
    'readable_written_rows',
    'readable_result_rows',
    'query_kind',
    'type',
    'client_name',
    'query_id',
  ],
  columnFormats: {
    user: ColumnFormat.ColoredBadge,
    type: ColumnFormat.ColoredBadge,
    query_duration: ColumnFormat.Duration,
    query_kind: ColumnFormat.ColoredBadge,
    readable_query: ColumnFormat.Code,
    query: [
      ColumnFormat.CodeDialog,
      { max_truncate: 100, hide_query_comment: true, dialog_title: 'Query' },
    ],
    event_time: ColumnFormat.RelatedTime,
    readable_read_rows: ColumnFormat.BackgroundBar,
    readable_written_rows: ColumnFormat.BackgroundBar,
    readable_memory_usage: ColumnFormat.BackgroundBar,
    query_id: [ColumnFormat.Link, { href: '/[ctx.hostId]/query/[query_id]' }],
  },

  defaultParams: {
    type: '',
    duration_1m: '',
    event_time: '',
    database: '',
    table: '',
    user: '',
  },

  filterParamPresets: [
    {
      name: 'type = QueryStart',
      key: 'type',
      value: 'QueryStart',
    },
    {
      name: 'type = QueryFinish',
      key: 'type',
      value: 'QueryFinish',
    },
    {
      name: 'type = ExceptionBeforeStart',
      key: 'type',
      value: 'ExceptionBeforeStart',
    },
    {
      name: 'type = ExceptionWhileProcessing',
      key: 'type',
      value: 'ExceptionWhileProcessing',
    },
    {
      name: 'query_duration > 1m',
      key: 'duration_1m',
      value: '1',
    },
  ],

  relatedCharts: [
    ['query-count', {}],
    ['query-duration', {}],
    ['query-memory', {}],
    [
      'query-count-by-user',
      {
        showLegend: false,
      },
    ],
  ],
}
