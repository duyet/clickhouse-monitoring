import type { QueryConfig } from '@/types/query-config'

import { createExpandedPanel } from '@/components/data-table/cells/expanded-panel'
import { ColumnFormat } from '@/types/column-format'

/**
 * system.query_condition_cache — added in ClickHouse 25.3
 *
 * Stores cached query conditions (WHERE-clause analysis results) so that
 * repeated queries with the same filters skip redundant planning work.
 * The table is empty until the optimizer has seen enough repeated queries.
 *
 * Schema reference: https://clickhouse.com/docs/en/operations/system-tables/query_condition_cache
 */
export const queryConditionCacheConfig: QueryConfig = {
  name: 'query-condition-cache',
  description:
    'Cached query conditions from system.query_condition_cache (ClickHouse 25.3+)',
  docs: 'https://clickhouse.com/docs/en/operations/system-tables/query_condition_cache',
  // Optional: only available on ClickHouse 25.3+
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
    hits: ColumnFormat.NumberShort,
    readable_hits: ColumnFormat.BackgroundBar,
    query: [
      ColumnFormat.CodeDialog,
      { max_truncate: 120, hide_query_comment: true },
    ],
    condition: [ColumnFormat.CodeDialog, { max_truncate: 120 }],
  },
  expandable: {
    renderExpanded: createExpandedPanel({
      sections: [
        {
          type: 'fields',
          title: 'Cache Entry',
          columns: [
            { key: 'key', label: 'Key (hash)' },
            { key: 'hits', label: 'Cache hits' },
          ],
        },
        { type: 'code', title: 'Query', column: 'query' },
        { type: 'code', title: 'Cached condition', column: 'condition' },
      ],
    }),
  },
  relatedCharts: [['query-cache', {}]],
}
