import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const queryCacheConfig: QueryConfig = {
  name: 'query-cache',
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
          (now() - expires_at) AS expires_in,
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
