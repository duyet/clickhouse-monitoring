import type { QueryConfig } from '@/types/query-config'

import { ColumnFormat } from '@/types/column-format'

export const partInfoConfig: QueryConfig = {
  name: 'part-info',
  description:
    'Information about currently active parts and levels for a table',

  // Version-aware SQL queries (oldest → newest)
  // Note: 'marks' is the correct column (NOT 'marks_count')
  sql: [
    {
      since: '19.1',
      description: 'Base query - primary_key_bytes_in_memory not available',
      sql: `
        SELECT
          name,
          partition,
          level,
          rows,
          formatReadableQuantity(rows) as readable_rows,
          data_compressed_bytes,
          formatReadableSize(data_compressed_bytes) AS readable_compressed,
          data_uncompressed_bytes,
          formatReadableSize(data_uncompressed_bytes) AS readable_uncompressed,
          round(data_uncompressed_bytes / data_compressed_bytes, 2) AS compression_ratio,
          marks,
          0 AS primary_key_bytes_in_memory,
          '-' AS readable_primary_key_size,
          modification_time,
          active,
          min_date,
          max_date,
          min_block_number,
          max_block_number,
          disk_name,
          path
        FROM system.parts
        WHERE database = {database: String}
          AND table = {table: String}
          AND active = 1
        ORDER BY name ASC
      `,
    },
    {
      since: '21.8',
      description: 'Includes primary_key_bytes_in_memory columns',
      sql: `
        SELECT
          name,
          partition,
          level,
          rows,
          formatReadableQuantity(rows) as readable_rows,
          data_compressed_bytes,
          formatReadableSize(data_compressed_bytes) AS readable_compressed,
          data_uncompressed_bytes,
          formatReadableSize(data_uncompressed_bytes) AS readable_uncompressed,
          round(data_uncompressed_bytes / data_compressed_bytes, 2) AS compression_ratio,
          marks,
          primary_key_bytes_in_memory,
          formatReadableSize(primary_key_bytes_in_memory) AS readable_primary_key_size,
          modification_time,
          active,
          min_date,
          max_date,
          min_block_number,
          max_block_number,
          disk_name,
          path
        FROM system.parts
        WHERE database = {database: String}
          AND table = {table: String}
          AND active = 1
        ORDER BY name ASC
      `,
    },
  ],

  columns: [
    'name',
    'partition',
    'level',
    'readable_rows',
    'readable_compressed',
    'readable_uncompressed',
    'compression_ratio',
    'marks',
    'readable_primary_key_size',
    'modification_time',
    'min_date',
    'max_date',
    'disk_name',
  ],
  columnFormats: {
    name: ColumnFormat.Code,
    partition: ColumnFormat.Code,
    level: ColumnFormat.Number,
    readable_rows: ColumnFormat.BackgroundBar,
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    compression_ratio: ColumnFormat.Number,
    marks: ColumnFormat.Number,
    readable_primary_key_size: ColumnFormat.BackgroundBar,
    modification_time: ColumnFormat.RelatedTime,
    disk_name: ColumnFormat.ColoredBadge,
  },
  sortingFns: {
    readable_rows: 'sort_column_using_actual_value',
    readable_compressed: 'sort_column_using_actual_value',
    readable_uncompressed: 'sort_column_using_actual_value',
  },
  defaultParams: {
    database: 'default',
    table: '',
  },
}
