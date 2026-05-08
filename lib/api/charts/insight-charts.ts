/**
 * Insight Charts
 * Charts for the insights page displaying record-breaking query and storage statistics
 */

import { buildTimeFilter } from '@/lib/clickhouse-query'
import type { ChartQueryBuilder, ChartQueryParams } from './types'

// Helper to build time filter condition for insight queries
function buildInsightTimeFilter(params: ChartQueryParams): string {
  const { lastHours } = params
  if (lastHours === undefined) return '' // No filter for "all" range
  const safe = Math.floor(lastHours)
  if (!Number.isFinite(safe) || safe <= 0) return ''
  return `AND event_time >= (now() - INTERVAL ${safe} HOUR)`
}

export const insightCharts: Record<string, ChartQueryBuilder> = {
  'insight-largest-scan': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
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
        WHERE type = 'QueryFinish' AND is_initial_query = 1 ${timeFilter}
        ORDER BY read_bytes DESC
        LIMIT 1
      `,
    }
  },

  'insight-fastest-scan': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
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
        WHERE type = 'QueryFinish' AND is_initial_query = 1 AND query_duration_ms > 0 ${timeFilter}
        ORDER BY bytes_per_second DESC
        LIMIT 1
      `,
    }
  },

  'insight-longest-query': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
      query: `
        SELECT
          query_duration_ms,
          formatReadableSize(memory_usage) as readable_memory,
          formatReadableSize(read_bytes) as readable_bytes,
          substring(query, 1, 200) as query,
          user,
          event_time
        FROM system.query_log
        WHERE type = 'QueryFinish' AND is_initial_query = 1 ${timeFilter}
        ORDER BY query_duration_ms DESC
        LIMIT 1
      `,
    }
  },

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

  // Busiest day by query count
  'insight-busiest-day-queries': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
      query: `
        SELECT
          toDate(event_time) as day,
          count() as query_count,
          formatReadableQuantity(count()) as readable_count
        FROM system.query_log
        WHERE type = 'QueryFinish' AND is_initial_query = 1 ${timeFilter}
        GROUP BY day
        ORDER BY query_count DESC
        LIMIT 1
      `,
    }
  },

  // Busiest day by data scanned
  'insight-busiest-day-bytes': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
      query: `
        SELECT
          toDate(event_time) as day,
          sum(read_bytes) as total_bytes,
          formatReadableSize(sum(read_bytes)) as readable_bytes,
          count() as query_count
        FROM system.query_log
        WHERE type = 'QueryFinish' AND is_initial_query = 1 ${timeFilter}
        GROUP BY day
        ORDER BY total_bytes DESC
        LIMIT 1
      `,
    }
  },

  // Peak concurrent queries
  'insight-peak-concurrent': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
      query: `
        SELECT
          max(concurrent) as peak_concurrent,
          formatReadableQuantity(max(concurrent)) as readable_count
        FROM (
          SELECT
            count() as concurrent
          FROM system.query_log
          WHERE type = 'QueryFinish' AND is_initial_query = 1 ${timeFilter}
          GROUP BY event_time
        )
      `,
    }
  },

  // Average query duration
  'insight-avg-duration': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
      query: `
        SELECT
          avg(query_duration_ms) as avg_duration_ms,
          count() as query_count
        FROM system.query_log
        WHERE type = 'QueryFinish' AND is_initial_query = 1 ${timeFilter}
      `,
    }
  },

  // Query error rate
  'insight-error-rate': (params) => {
    const timeFilter = buildInsightTimeFilter(params)
    return {
      query: `
        SELECT
          round(countIf(type = 'ExceptionBeforeStart' OR type = 'ExceptionWhileProcessing') * 100.0 / count(), 2) as error_rate,
          countIf(type = 'ExceptionBeforeStart' OR type = 'ExceptionWhileProcessing') as error_count,
          count() as total_count
        FROM system.query_log
        WHERE is_initial_query = 1 ${timeFilter}
      `,
    }
  },
}
