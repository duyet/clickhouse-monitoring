import type { DeclarativeQueryConfig } from '../../schema'

export const queryCacheDeclarative: DeclarativeQueryConfig = {
  name: 'query-cache',
  optional: false,
  defaultView: 'auto',
  card: { primary: 'query', badges: ['stale', 'shared', 'compressed'] },
  description:
    'https://clickhouse.com/blog/introduction-to-the-clickhouse-query-cache-and-design',
  suggestion: `Enable query cache with these settings:

SET enable_query_result_cache = 1;
SET query_cache_max_size_in_bytes = 1073741824;
SET query_cache_min_query_duration_ms = 1000;

Learn more:
https://clickhouse.com/docs/en/operations/query-cache`,
  // Inlined from table-notes QUERY_CACHE (docs is now a plain string)
  docs: `The required table 'query_cache' may be missing. Please follow the documentation at https://clickhouse.com/docs/en/operations/query-cache to ensure the necessary table is available.`,
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
    query: 'code-dialog',
    readable_result_size: 'background-bar',
    stale: 'boolean',
    shared: 'boolean',
    compressed: 'boolean',
    expires_in: 'duration',
  },
  relatedCharts: [['query-cache', {}]],
}
