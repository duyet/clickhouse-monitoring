import { type QueryConfig } from '@/lib/types/query-config'
import { ColumnFormat } from '@/components/data-table/column-defs'

export const topUsageColumnsConfig: QueryConfig = {
  name: 'top-usage-columns',
  description: 'Most usage columns of table based on system.query_log',
  sql: `
      SELECT
          columns as column,
          count() as count,
          round(100 * count() / max(count()) OVER ()) as pct_count
      FROM system.query_log
      ARRAY JOIN columns
      WHERE (query_kind = 'Select')
        AND (type = 'QueryFinish')
        AND (has(tables, {table: String}))
        AND (positionCaseInsensitive(column, {table:String}) != 0)
      GROUP BY 1
      ORDER BY 2 DESC`,
  columns: ['column', 'count'],
  columnFormats: {
    count: ColumnFormat.BackgroundBar,
  },
}
