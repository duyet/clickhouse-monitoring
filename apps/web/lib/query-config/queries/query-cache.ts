import type { QueryConfig } from '@/types/query-config'

import { QUERY_CACHE } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'

export const queryCacheConfig: QueryConfig = {
  name: 'query-cache',
  description:
    'https://clickhouse.com/blog/introduction-to-the-clickhouse-query-cache-and-design',
  suggestion: `Enable query cache with these settings:

SET enable_query_result_cache = 1;
SET query_cache_max_size_in_bytes = 1073741824;
SET query_cache_min_query_duration_ms = 1000;

Learn more:
https://clickhouse.com/docs/en/operations/query-cache`,
  docs: QUERY_CACHE,
  tableCheck: 'system.query_cache',
  sql: `
      SELECT
          query,
          result_size,
          formatReadableSize(result_size) AS readable_result_size,
          round(100 * result_size / max(result_size) OVER ()) AS pct_result_size,
          stale,
          shared,
          compressed,
          expires_at,
          (expires_at - now()) AS expires_in,
          key_hash
      FROM system.query_cache
      ORDER BY expires_at DESC
      LIMIT 1000
    `,
  columns: [
    'query',
    'readable_result_size',
    'stale',
    'shared',
    'compressed',
    'expires_at',
    'expires_in',
    'key_hash',
  ],
  columnFormats: {
    query: ColumnFormat.CodeDialog,
    readable_result_size: ColumnFormat.BackgroundBar,
    stale: ColumnFormat.Boolean,
    shared: ColumnFormat.Boolean,
    compressed: ColumnFormat.Boolean,
    expires_in: ColumnFormat.Duration,
  },

  relatedCharts: [['query-cache', {}]],
}
