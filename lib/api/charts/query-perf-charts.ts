/**
 * Query Performance Charts
 * Charts for insert throughput, batch size analysis, and top inserters
 */

import type { ChartQueryBuilder } from './types'

import { applyInterval, buildTimeFilter } from './types'

export const queryPerfCharts: Record<string, ChartQueryBuilder> = {
  'insert-performance': ({
    interval = 'toStartOfFifteenMinutes',
    lastHours = 24,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        ${applyInterval(interval, 'event_time')},
        count() AS insert_count,
        sum(written_rows) AS total_rows,
        formatReadableQuantity(sum(written_rows)) AS readable_rows,
        sum(written_bytes) AS total_bytes,
        formatReadableSize(sum(written_bytes)) AS readable_bytes,
        round(avg(written_rows), 0) AS avg_batch_size,
        formatReadableQuantity(round(avg(written_rows), 0)) AS readable_avg_batch
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND query_kind = 'Insert'
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    }
  },

  'top-query-fingerprints': ({ lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        normalized_query_hash,
        any(substring(query, 1, 120)) AS query_preview,
        count() AS execution_count,
        formatReadableQuantity(count()) AS readable_count,
        round(avg(query_duration_ms), 1) AS avg_duration_ms,
        round(quantile(0.95)(query_duration_ms), 1) AS p95_duration_ms,
        sum(read_rows) AS total_read_rows,
        formatReadableQuantity(sum(read_rows)) AS readable_read_rows,
        sum(memory_usage) AS total_memory,
        formatReadableSize(sum(memory_usage)) AS readable_memory
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND query_kind = 'Select'
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY normalized_query_hash
      ORDER BY count() DESC
      LIMIT 20
    `,
    }
  },

  'query-duration-trend': ({
    interval = 'toStartOfHour',
    lastHours = 24 * 7,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        ${applyInterval(interval, 'event_time')},
        count() AS query_count,
        round(avg(query_duration_ms), 1) AS avg_duration_ms,
        round(quantile(0.95)(query_duration_ms), 1) AS p95_duration_ms
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND query_kind = 'Select'
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    }
  },

  'top-inserters': ({ lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
      SELECT
        user,
        count() AS insert_count,
        sum(written_rows) AS total_rows,
        formatReadableQuantity(sum(written_rows)) AS readable_rows,
        round(avg(written_rows), 0) AS avg_batch_size,
        formatReadableQuantity(round(avg(written_rows), 0)) AS readable_avg_batch,
        sum(written_bytes) AS total_bytes,
        formatReadableSize(sum(written_bytes)) AS readable_bytes
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND query_kind = 'Insert'
        ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY user
      ORDER BY total_rows DESC
      LIMIT 10
    `,
    }
  },
}
