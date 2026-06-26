import type { DeclarativeQueryConfig } from '../../schema'

/**
 * Declarative mirror of query-condition-cache.ts
 * system.query_condition_cache — ClickHouse 25.3+
 */
export const queryConditionCacheDeclarative: DeclarativeQueryConfig = {
  name: 'query-condition-cache',
  description:
    'Cached query conditions from system.query_condition_cache (ClickHouse 25.3+)',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/query_condition_cache',
  optional: true,
  tableCheck: 'system.query_condition_cache',
  defaultView: 'auto',
  card: {
    primary: 'condition',
    badges: ['hits'],
    metrics: ['hits'],
  },
  sql: `
      SELECT
          key,
          hits,
          formatReadableQuantity(hits) AS readable_hits,
          round(hits * 100.0 / nullIf(max(hits) OVER (), 0), 2) AS pct_hits,
          query,
          condition
      FROM system.query_condition_cache
      ORDER BY hits DESC
      LIMIT 1000
    `,
  columns: ['key', 'hits', 'readable_hits', 'query', 'condition'],
  columnFormats: {
    hits: 'number-short',
    readable_hits: 'background-bar',
    query: ['code-dialog', { max_truncate: 120, hide_query_comment: true }],
    condition: ['code-dialog', { max_truncate: 120 }],
  },
  expandable: {
    type: 'config-details',
    primaryColumns: ['key', 'hits', 'readable_hits'],
  },
  relatedCharts: [['query-cache', {}]],
}
