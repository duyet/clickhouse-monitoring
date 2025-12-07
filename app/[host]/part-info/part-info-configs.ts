import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export const partitionCountConfig: QueryConfig = {
  name: 'partition-count',
  sql: `
    WITH partition_info AS (
      SELECT
        partition,
        level,
        rows
      FROM system.parts
      WHERE database = {database:String} AND \`table\` = {table:String} AND active
    )
    SELECT
      partition,
      count() AS count,
      round(100 * count() / max(count()) OVER ()) AS pct_count
    FROM partition_info
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT {limit:UInt64}
  `,
  columns: ['partition', 'count'],
  columnFormats: {
    count: ColumnFormat.BackgroundBar,
  },
  defaultParams: {
    database: 'default',
    table: '',
    limit: 100,
  },
}

export const levelCountConfig: QueryConfig = {
  name: 'level-count',
  sql: `
    WITH part_info AS (
      SELECT
        name,
        level,
        rows
      FROM system.parts
      WHERE database = {database:String} AND \`table\` = {table:String} AND active
      ORDER BY name ASC
    )
    SELECT
      level,
      count() AS count,
      round(100 * count() / max(count()) OVER ()) AS pct_count
    FROM part_info
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT {limit:UInt64}
  `,
  columns: ['level', 'count'],
  columnFormats: {
    count: ColumnFormat.BackgroundBar,
  },
  defaultParams: {
    database: 'default',
    table: '',
    limit: 100,
  },
}
