import type { DeclarativeQueryConfig } from '../../schema'

export const explorerIndexesDeclarative: DeclarativeQueryConfig = {
  name: 'explorer-indexes',
  description: 'Index and key information for a table',
  sql: 'SELECT partition_key, sorting_key, primary_key, sampling_key, engine, engine_full FROM system.tables WHERE database = {database:String} AND name = {table:String}',
  columns: [
    'partition_key',
    'sorting_key',
    'primary_key',
    'sampling_key',
    'engine',
    'engine_full',
  ],
  optional: false,
  defaultParams: { database: 'default', table: '' },
}
