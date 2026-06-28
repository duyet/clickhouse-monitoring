import type { QueryConfig } from '@/types/query-config'

export const explorerTableOverviewConfig: QueryConfig = {
  name: 'explorer-table-overview',
  description:
    'Per-table summary: size, rows, engine, index size, compression, parts and partitions',
  sql: `
    SELECT
      total_bytes,
      total_rows,
      engine,
      engine_full,
      metadata_modification_time,
      (SELECT sum(primary_key_bytes_in_memory)           FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS primary_key_bytes_in_memory,
      (SELECT sum(primary_key_bytes_in_memory_allocated) FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS primary_key_bytes_in_memory_allocated,
      (SELECT sum(data_compressed_bytes)                 FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS compressed_bytes,
      (SELECT sum(data_uncompressed_bytes)               FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS uncompressed_bytes,
      (SELECT count()                                    FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS active_parts,
      (SELECT uniqExact(partition)                       FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS partitions,
      (SELECT max(modification_time)                     FROM system.parts WHERE database = {database:String} AND table = {table:String} AND active) AS last_modified
    FROM system.tables
    WHERE database = {database:String} AND name = {table:String}
  `,
  columns: [
    'total_bytes',
    'total_rows',
    'engine',
    'engine_full',
    'primary_key_bytes_in_memory',
    'primary_key_bytes_in_memory_allocated',
    'metadata_modification_time',
    'compressed_bytes',
    'uncompressed_bytes',
    'active_parts',
    'partitions',
    'last_modified',
  ],
  defaultParams: { database: 'default', table: '' },
}

export const explorerTableUsageConfig: QueryConfig = {
  name: 'explorer-table-usage',
  description:
    'Query-usage count for a table from system.query_log (optional; degrades when query_log is disabled)',
  optional: true,
  tableCheck: 'system.query_log',
  sql: [
    {
      since: '22.8',
      description:
        'Count finished queries touching this table over 24h / 7d windows',
      sql: `
        SELECT
          countIf(event_time >= now() - INTERVAL 1 DAY) AS queries_24h,
          countIf(event_time >= now() - INTERVAL 7 DAY) AS queries_7d
        FROM system.query_log
        WHERE type = 'QueryFinish'
          AND is_initial_query = 1
          AND event_time >= now() - INTERVAL 7 DAY
          AND has(tables, concat({database:String}, '.', {table:String}))
      `,
    },
  ],
  columns: ['queries_24h', 'queries_7d'],
  defaultParams: { database: 'default', table: '' },
}
