import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const countAcrossReplicasConfig: QueryConfig = {
  name: 'count-across-replicas',
  description: 'All table count across replicas',
  sql: `
      SELECT
          hostName(),
          sum(rows) AS total_rows,
          formatReadableQuantity(total_rows),
          formatReadableSize(sum(bytes))
      FROM clusterAllReplicas('{cluster}', system.parts)
      WHERE active
      GROUP BY 1
      ORDER BY
          1 ASC,
          2 DESC

      SELECT
          tables as table,
          count() as count,
          round(100 * count() / max(count()) OVER ()) as pct_count
      FROM system.query_log
      ARRAY JOIN tables
      WHERE (query_kind = 'Select')
        AND (type = 'QueryFinish')
        AND (tables NOT LIKE '%temp%')
        AND (tables NOT LIKE '_table_function%')
        AND (tables NOT LIKE 'system%')
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 50`,
  columns: ['table', 'count'],
  columnFormats: {
    table: [ColumnFormat.Link, { href: `/top-usage-columns?table=[table]` }],
    count: ColumnFormat.BackgroundBar,
  },
}
