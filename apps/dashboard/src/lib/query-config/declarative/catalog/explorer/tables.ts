import type { DeclarativeQueryConfig } from '../../schema'

export const explorerTablesDeclarative: DeclarativeQueryConfig = {
  name: 'explorer-tables',
  description: 'List of tables in a database',
  sql: "SELECT name, engine, total_rows, total_bytes, formatReadableSize(total_bytes) as readable_size FROM system.tables WHERE database = {database:String} AND is_temporary = 0 AND name NOT LIKE '.inner_%' ORDER BY name",
  columns: ['name', 'engine', 'total_rows', 'total_bytes', 'readable_size'],
  optional: false,
  defaultParams: { database: 'default' },
}
