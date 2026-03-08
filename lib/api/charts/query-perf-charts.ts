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
        formatReadableQuantity(total_rows) AS readable_rows,
        sum(written_bytes) AS total_bytes,
        formatReadableSize(total_bytes) AS readable_bytes,
        round(avg(written_rows), 0) AS avg_batch_size,
        formatReadableQuantity(avg_batch_size) AS readable_avg_batch
      FROM system.query_log
      WHERE type = 'QueryFinish'
        AND query_kind = 'Insert'
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
        formatReadableQuantity(total_rows) AS readable_rows,
        round(avg(written_rows), 0) AS avg_batch_size,
        formatReadableQuantity(avg_batch_size) AS readable_avg_batch,
        sum(written_bytes) AS total_bytes,
        formatReadableSize(total_bytes) AS readable_bytes
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
