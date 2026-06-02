import type { QueryConfig } from '@/types/query-config'

export const explorerSkipIndexesConfig: QueryConfig = {
  name: 'explorer-skip-indexes',
  description: 'Data skipping indexes for a specific table',
  optional: true,
  tableCheck: 'system.data_skipping_indices',
  sql: `
    SELECT
        name,
        type,
        type_full,
        expr,
        granularity,
        formatReadableSize(data_compressed_bytes) AS compressed_size,
        formatReadableSize(data_uncompressed_bytes) AS uncompressed_size,
        if(data_compressed_bytes > 0, round(data_uncompressed_bytes / data_compressed_bytes, 2), 0) AS compression_ratio
    FROM system.data_skipping_indices
    WHERE database = {database:String}
      AND table = {table:String}
    ORDER BY data_compressed_bytes DESC
  `,
  columns: [
    'name',
    'type',
    'type_full',
    'expr',
    'granularity',
    'compressed_size',
    'uncompressed_size',
    'compression_ratio',
  ],
  defaultParams: { database: 'default', table: '' },
}
