import { QUERY_LOG } from '@/lib/table-notes'
import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const topUsageTablesConfig: QueryConfig = {
  name: 'top-usage-tables',
  description:
    'Most usage tables, ignore system tables, based on system.query_log (top 50). Click on table name to see top usage columns.',
  docs: QUERY_LOG,
  sql: `
      SELECT
          tables as table,
          count() as count,
          round(100 * count() / max(count()) OVER ()) as pct_count
      FROM merge(system, '^query_log')
      ARRAY JOIN tables
      WHERE (query_kind = 'Select')
        AND (if({database: String} != '', startsWith(table, {database: String}), true))
        AND (type = 'QueryFinish')
        AND (tables NOT LIKE '%temp%')
        AND (tables NOT LIKE '_table_function%')
        AND (tables NOT LIKE 'system%')
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 50`,
  columns: ['table', 'count'],
  columnFormats: {
    table: [
      ColumnFormat.Link,
      { href: `/[ctx.hostId]/top-usage-columns?table=[table]` },
    ],
    count: ColumnFormat.BackgroundBar,
  },
  defaultParams: { database: '' },
}
