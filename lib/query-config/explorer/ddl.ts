import type { QueryConfig } from '@/types/query-config'

export const explorerDdlConfig: QueryConfig = {
  name: 'explorer-ddl',
  description: 'DDL statement for a table',
  sql: `SELECT create_table_query FROM system.tables WHERE database = {database:String} AND name = {table:String}`,
  columns: ['create_table_query'],
  defaultParams: { database: 'default', table: '' },
}
