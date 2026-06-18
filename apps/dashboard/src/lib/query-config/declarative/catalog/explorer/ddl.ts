import type { DeclarativeQueryConfig } from '../../schema'

export const explorerDdlDeclarative: DeclarativeQueryConfig = {
  name: 'explorer-ddl',
  description: 'DDL statement for a table',
  sql: 'SELECT create_table_query FROM system.tables WHERE database = {database:String} AND name = {table:String}',
  columns: ['create_table_query'],
  optional: false,
  defaultParams: { database: 'default', table: '' },
}
