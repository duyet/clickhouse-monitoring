import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const textLogConfig: QueryConfig = {
  name: 'text-log',
  description: 'Server log messages for debugging',
  optional: true,
  tableCheck: 'system.text_log',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/text_log',
  sql: `
    SELECT
      event_time,
      level,
      query_id,
      thread_id,
      message,
      logger_name,
      source_file,
      source_line
    FROM system.text_log
    WHERE event_date >= today()
    ORDER BY event_time DESC
    LIMIT 1000
  `,
  columns: [
    'event_time',
    'level',
    'query_id',
    'thread_id',
    'message',
    'logger_name',
    'source_file',
    'source_line',
  ],
  columnFormats: {
    event_time: ColumnFormat.RelatedTime,
    level: ColumnFormat.ColoredBadge,
    query_id: [
      ColumnFormat.Link,
      {
        href: '/query?query_id=[query_id]&host=[ctx.hostId]',
        className: 'max-w-24 truncate',
      },
    ],
    thread_id: ColumnFormat.Number,
    message: [
      ColumnFormat.CodeDialog,
      { max_truncate: 80, dialog_title: 'Log Message' },
    ],
    logger_name: ColumnFormat.ColoredBadge,
    source_file: ColumnFormat.Text,
    source_line: ColumnFormat.Number,
  },
  filterParamPresets: [
    { name: 'Errors Only', key: 'level', value: 'Error' },
    { name: 'Warnings+', key: 'level', value: 'Warning' },
    { name: 'Debug', key: 'level', value: 'Debug' },
  ],
  relatedCharts: ['log-level-distribution', 'error-rate-over-time'],
}
