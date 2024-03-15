import { ColumnFormat } from '@/components/data-table/column-defs'
import { type QueryConfig } from '@/lib/types/query-config'

export const expensiveQueriesByMemoryConfig: QueryConfig = {
  name: 'expensive-queries-by-memory',
  description: 'Most expensive queries by memory finished over last 24 hours',
  sql: `
      SELECT
          query,
          user,
          count() as cnt,
          sum(memory_usage) AS sum_memory,
          avg(memory_usage) AS avg_memory,
          formatReadableSize(sum_memory) AS readable_sum_memory,
          formatReadableSize(avg_memory) AS readable_avg_memory,
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
    query: ColumnFormat.CodeToggle,
  },
}
