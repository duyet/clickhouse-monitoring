import type { QueryConfig } from '@/types/query-config'

export const explorerDatabasesConfig: QueryConfig = {
  name: 'explorer-databases',
  description: 'List of ClickHouse databases',
  sql: `SELECT name, engine, data_path, uuid FROM system.databases WHERE name NOT IN ('INFORMATION_SCHEMA', 'information_schema') ORDER BY name`,
  columns: ['name', 'engine', 'data_path', 'uuid'],
}
