import type { QueryConfig } from '@/types/query-config'

export const explorerProjectionsConfig: QueryConfig = {
  name: 'explorer-projections',
  description: 'Projections for a specific table',
  sql: `
    SELECT
        name,
        formatReadableSize(sum(data_compressed_bytes)) AS compressed_size,
        formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed_size,
        round(sum(data_uncompressed_bytes) / sum(data_compressed_bytes), 2) AS compression_ratio,
        formatReadableQuantity(sum(rows)) AS rows,
        count() AS parts
    FROM system.projection_parts
    WHERE database = {database:String}
      AND table = {table:String}
      AND active
    GROUP BY name
    ORDER BY sum(data_compressed_bytes) DESC
  `,
  columns: [
    'name',
    'compressed_size',
    'uncompressed_size',
    'compression_ratio',
    'rows',
    'parts',
  ],
  defaultParams: { database: 'default', table: '' },
}
