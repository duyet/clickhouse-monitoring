import { QUERY_LOG } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export const expensiveQueriesByMemoryConfig: QueryConfig = {
  name: 'expensive-queries-by-memory',
  description: 'Most expensive queries by memory finished over last 24 hours',
  docs: QUERY_LOG,
  tableCheck: 'system.query_log',
  sql: `
      SELECT
          query,
          user,
          count() as cnt,
          sum(memory_usage) AS sum_memory,
          avg(memory_usage) AS avg_memory,
          formatReadableSize(sum_memory) AS readable_sum_memory,
          formatReadableSize(avg_memory) AS readable_avg_memory,
          round(100 * cnt / max(cnt) OVER ()) AS pct_cnt,
          round(100 * sum_memory / max(sum_memory) OVER ()) AS pct_sum_memory,
          round(100 * avg_memory / max(avg_memory) OVER ()) AS pct_avg_memory,
          normalized_query_hash
      FROM system.query_log
      WHERE
          (event_time >= (now() - toIntervalDay(1)))
          AND query_kind = 'Select'
          AND type = 'QueryFinish'
      GROUP BY
          normalized_query_hash,
          query,
          user
      ORDER BY avg_memory DESC
      LIMIT 1000
    `,
  columns: [
    'query',
    'user',
    'cnt',
    'readable_avg_memory',
    'readable_sum_memory',
  ],
  columnFormats: {
    query: [
      ColumnFormat.CodeDialog,
      { max_truncate: 100, hide_query_comment: true },
    ],
    user: ColumnFormat.Badge,
    cnt: [ColumnFormat.BackgroundBar, { numberFormat: true }],
    readable_sum_memory: ColumnFormat.BackgroundBar,
    readable_avg_memory: ColumnFormat.BackgroundBar,
  },
}
