/**
 * Insight Charts
 * Charts for the insights page displaying record-breaking query and storage statistics
 */

import type { ChartQueryBuilder } from './types'

export const insightCharts: Record<string, ChartQueryBuilder> = {
  'insight-largest-scan': () => ({
    query: `
      SELECT
        formatReadableSize(read_bytes) as readable_bytes,
        formatReadableQuantity(read_rows) as readable_rows,
        read_bytes,
        read_rows,
        query_duration_ms,
        formatReadableSize(read_bytes / greatest(query_duration_ms, 1) * 1000) as readable_speed,
        user,
        event_time
      FROM system.query_log
      WHERE type = 'QueryFinish' AND is_initial_query = 1
      ORDER BY read_bytes DESC
      LIMIT 1
    `,
  }),

  'insight-fastest-scan': () => ({
    query: `
      SELECT
        formatReadableSize(read_bytes / greatest(query_duration_ms, 1) * 1000) as readable_speed,
        read_bytes / greatest(query_duration_ms, 1) * 1000 as bytes_per_second,
        formatReadableSize(read_bytes) as readable_bytes,
        read_bytes,
        query_duration_ms,
        user,
        event_time
      FROM system.query_log
      WHERE type = 'QueryFinish' AND is_initial_query = 1 AND query_duration_ms > 0
      ORDER BY bytes_per_second DESC
      LIMIT 1
    `,
  }),

  'insight-longest-query': () => ({
    query: `
      SELECT
        query_duration_ms,
        formatReadableSize(memory_usage) as readable_memory,
        formatReadableSize(read_bytes) as readable_bytes,
        substring(query, 1, 200) as query,
        user,
        event_time
      FROM system.query_log
      WHERE type = 'QueryFinish' AND is_initial_query = 1
      ORDER BY query_duration_ms DESC
      LIMIT 1
    `,
  }),

  'insight-top-tables-by-size': () => ({
    query: `
      SELECT
        table,
        database,
        formatReadableSize(sum(bytes_on_disk)) as size,
        sum(bytes_on_disk) as bytes,
        formatReadableQuantity(sum(rows)) as readable_rows,
        sum(rows) as total_rows,
        count() as part_count
      FROM system.parts
      WHERE active
      GROUP BY database, table
      ORDER BY sum(bytes_on_disk) DESC
      LIMIT 10
    `,
  }),

  'insight-compression-ratios': () => ({
    query: `
      SELECT
        table,
        database,
        round(sum(data_compressed_bytes) * 1.0 / nullIf(sum(data_uncompressed_bytes), 0), 3) as compression_ratio,
        formatReadableSize(sum(data_uncompressed_bytes)) as uncompressed,
        formatReadableSize(sum(bytes_on_disk)) as compressed
      FROM system.parts
      WHERE active
      GROUP BY database, table
      HAVING sum(data_uncompressed_bytes) > 1048576
      ORDER BY compression_ratio ASC
      LIMIT 10
    `,
  }),

  'insight-total-storage': () => ({
    query: `
      SELECT
        formatReadableSize(sum(bytes_on_disk)) as total_compressed,
        formatReadableSize(sum(data_uncompressed_bytes)) as total_uncompressed,
        round(sum(data_compressed_bytes) * 1.0 / nullIf(sum(data_uncompressed_bytes), 0), 3) as overall_compression_ratio,
        countDistinct(concat(database, '.', table)) as total_tables,
        sum(rows) as total_rows,
        formatReadableQuantity(sum(rows)) as readable_rows
      FROM system.parts
      WHERE active
    `,
  }),

  'insight-query-summary': () => ({
    query: `
      SELECT
        count() as total_queries,
        formatReadableSize(sum(read_bytes)) as total_scanned,
        sum(read_rows) as total_rows_scanned,
        formatReadableQuantity(sum(read_rows)) as readable_rows,
        avg(query_duration_ms) as avg_duration_ms,
        max(query_duration_ms) as max_duration_ms,
        formatReadableSize(max(read_bytes)) as largest_scan,
        formatReadableSize(max(memory_usage)) as peak_memory
      FROM system.query_log
      WHERE type = 'QueryFinish' AND is_initial_query = 1
    `,
  }),
}
