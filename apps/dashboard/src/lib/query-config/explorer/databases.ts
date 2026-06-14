import type { QueryConfig } from '@/types/query-config'

export const explorerDatabasesConfig: QueryConfig = {
  name: 'explorer-databases',
  description: 'List of ClickHouse databases with table counts',
  sql: `
    SELECT
      d.name,
      d.engine,
      d.data_path,
      d.uuid,
      count(t.name) AS item_count
    FROM system.databases d
    LEFT JOIN system.tables t ON d.name = t.database
    WHERE d.name NOT IN ('INFORMATION_SCHEMA', 'information_schema')
    GROUP BY d.name, d.engine, d.data_path, d.uuid
    ORDER BY d.name
  `,
  columns: ['name', 'engine', 'data_path', 'uuid', 'item_count'],
}
