import type { QueryConfig } from '@/types/query-config'

export const explorerColumnsConfig: QueryConfig = {
  name: 'explorer-columns',
  description: 'Columns in a table',
  sql: `SELECT name, type, is_in_primary_key, is_in_sorting_key, is_in_partition_key FROM system.columns WHERE database = {database:String} AND table = {table:String} ORDER BY position`,
  columns: [
    'name',
    'type',
    'is_in_primary_key',
    'is_in_sorting_key',
    'is_in_partition_key',
  ],
  defaultParams: { database: 'default', table: '' },
}
