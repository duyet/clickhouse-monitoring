import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const historyQueriesConfig: QueryConfig = {
  name: 'history-queries',
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
          written_rows,
          formatReadableQuantity(written_rows) AS readable_written_rows,
          result_rows,
          formatReadableQuantity(result_rows) AS readable_result_rows,
          memory_usage,
          formatReadableSize(memory_usage) AS readable_memory_usage,
          query_kind,
          client_name
      FROM system.query_log
      WHERE type != 'QueryStart'
      ORDER BY event_time DESC
      LIMIT 1000
    `,
  columns: [
    'user',
    'type',
    'query',
    'query_duration',
    'event_time',
    'query_id',
    'readable_read_rows',
    'readable_written_rows',
    'readable_result_rows',
    'readable_memory_usage',
    'query_kind',
    'client_name',
  ],
  columnFormats: {
    user: ColumnFormat.ColoredBadge,
    type: ColumnFormat.ColoredBadge,
    query_duration: ColumnFormat.Duration,
    query_kind: ColumnFormat.ColoredBadge,
    readable_query: ColumnFormat.Code,
    query: ColumnFormat.CodeToggle,
    event_time: ColumnFormat.RelatedTime,
  },

  relatedCharts: [
    [
      'query-count',
      {
        title: 'Running Queries over last 14 days (query / day)',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
    [
      'query-duration',
      {
        title:
          'Avg Queries Duration over last 14 days (AVG(duration in seconds) / day)',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
    [
      'query-memory',
      {
        title: 'Avg Memory Usage for queries over last 14 days',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
      },
    ],
    [
      'query-count-by-user',
      {
        title: 'Total Queries over last 14 days by users',
        interval: 'toStartOfDay',
        lastHours: 24 * 14,
        showLegend: false,
      },
    ],
  ],
}
