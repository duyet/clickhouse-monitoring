import { ColumnFormat } from '@/types/column-format'
import type { QueryConfig } from '@/types/query-config'

export const tablesOverviewConfig: QueryConfig = {
  name: 'tables-overview',
  sql: `
      WITH
        detached_parts AS
        (
            SELECT
                format('{}.{}', database, \`table\`) AS \`table\`,
                count() AS detached_parts_count,
                sum(bytes_on_disk) AS detached_bytes_on_disk,
                formatReadableSize(detached_bytes_on_disk) AS readable_detached_bytes_on_disk
            FROM system.detached_parts
            GROUP BY 1
        ),
        parts AS
        (
            SELECT
                format('{}.{}', database, \`table\`) AS \`table\`,
                sum(rows) AS total_rows,
                formatReadableQuantity(total_rows) AS readable_total_rows,
                round((100 * total_rows) / max(total_rows) OVER ()) AS pct_total_rows,
                max(modification_time) AS latest_modification,

                sum(data_compressed_bytes) AS compressed,
                sum(data_uncompressed_bytes) AS uncompressed,
                round(uncompressed / compressed, 2) AS compr_rate,
                formatReadableSize(compressed) AS readable_compressed,
                formatReadableSize(uncompressed) AS readable_uncompressed,
                round((100 * compressed) / max(compressed) OVER ()) AS pct_compressed,
                round((100 * uncompressed) / max(uncompressed) OVER ()) AS pct_uncompressed,
                round((100 * compr_rate) / max(compr_rate) OVER ()) AS pct_compr_rate,

                avg(data_compressed_bytes) AS avg_part_size_compressed,
                avg(data_uncompressed_bytes) AS avg_part_size_uncompressed,
                formatReadableSize(avg_part_size_compressed) AS readable_avg_part_size_compressed,
                formatReadableSize(avg_part_size_uncompressed) AS readable_avg_part_size_uncompressed,
                round((100 * avg_part_size_compressed) / max(avg_part_size_compressed) OVER ()) AS pct_avg_part_size_compressed,
                round((100 * avg_part_size_uncompressed) / max(avg_part_size_uncompressed) OVER ()) AS pct_avg_part_size_uncompressed,

                max(data_compressed_bytes) AS max_part_size_compressed,
                max(data_uncompressed_bytes) AS max_part_size_uncompressed,
                formatReadableSize(max_part_size_compressed) AS readable_max_part_size_compressed,
                formatReadableSize(max_part_size_uncompressed) AS readable_max_part_size_uncompressed,
                round((100 * max_part_size_compressed) / max(max_part_size_compressed) OVER ()) AS pct_max_part_size_compressed,
                round((100 * max_part_size_uncompressed) / max(max_part_size_uncompressed) OVER ()) AS pct_max_part_size_uncompressed,

                sum(primary_key_bytes_in_memory) AS primary_keys_size,
                formatReadableSize(primary_keys_size) AS readable_primary_keys_size,
                round((100 * primary_keys_size) / max(primary_keys_size) OVER ()) AS pct_primary_keys_size,
                any(engine) AS engine,
                count() AS parts_count,
                round((100 * parts_count) / max(parts_count) OVER ()) AS pct_parts_count
            FROM system.parts AS parts
            WHERE active
            GROUP BY 1
            ORDER BY compressed DESC
        )
      SELECT
        parts.*,
        detached_parts.*,
        splitByChar('.', parts.table)[1] AS _database,
        splitByChar('.', parts.table)[2] AS _table
      FROM parts
      LEFT JOIN detached_parts USING (\`table\`)
    `,
  columns: [
    'table',
    'readable_compressed',
    'readable_uncompressed',
    'compr_rate',
    'readable_avg_part_size_compressed',
    'readable_avg_part_size_uncompressed',
    'readable_max_part_size_compressed',
    'readable_max_part_size_uncompressed',
    'readable_total_rows',
    'parts_count',
    'latest_modification',
    'readable_primary_keys_size',
    'readable_detached_bytes_on_disk',
    'engine',
  ],
  columnFormats: {
    table: [
      ColumnFormat.Link,
      { href: '/table?host=[ctx.hostId]&database=[_database]&table=[_table]' },
    ],
    engine: ColumnFormat.ColoredBadge,
    readable_total_rows: ColumnFormat.BackgroundBar,
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    readable_avg_part_size_compressed: ColumnFormat.BackgroundBar,
    readable_avg_part_size_uncompressed: ColumnFormat.BackgroundBar,
    readable_primary_keys_size: ColumnFormat.BackgroundBar,
    compr_rate: ColumnFormat.BackgroundBar,
    parts_count: [
      ColumnFormat.Link,
      { href: '/part-info?host=[ctx.hostId]&database=[_database]&table=[_table]' },
    ],
    readable_max_part_size_compressed: ColumnFormat.BackgroundBar,
    readable_max_part_size_uncompressed: ColumnFormat.BackgroundBar,
  },
  clickhouseSettings: {
    allow_experimental_analyzer: 0,
  },
  sortingFns: {
    compressed: 'sort_column_using_actual_value',
    uncompressed: 'sort_column_using_actual_value',
    avg_part_size_compressed: 'sort_column_using_actual_value',
    avg_part_size_uncompressed: 'sort_column_using_actual_value',
    max_part_size_compressed: 'sort_column_using_actual_value',
    max_part_size_uncompressed: 'sort_column_using_actual_value',
  },
}
