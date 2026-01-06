/**
 * Query Monitoring Charts
 * Charts for tracking query performance, counts, and memory usage
 */

import type { ChartQueryBuilder } from './types'

import { applyInterval, buildTimeFilter, fillStep, nowOrToday } from './types'

export const queryCharts: Record<string, ChartQueryBuilder> = {
  'query-count-today': () => ({
    query: `
      SELECT COUNT() AS count
      FROM merge('system', '^query_log')
      WHERE type = 'QueryFinish'
        AND toDate(event_time) = today()
    `,
  }),

  'query-count': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge('system', '^query_log')
      WHERE type = 'QueryFinish'
            ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY event_time
      ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
    ),
    query_kind AS (
      SELECT ${applyInterval(interval, 'event_time')},
               query_kind,
               COUNT() AS count
        FROM merge('system', '^query_log')
        WHERE type = 'QueryFinish'
              ${timeFilter ? `AND ${timeFilter}` : ''}
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_kind, count)) AS breakdown
      FROM query_kind
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `,
    }
  },

  'query-count-by-user': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           COUNT(*) AS count
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          ${timeFilter ? `AND ${timeFilter}` : ''}
          AND user != ''
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `,
    }
  },

  'query-duration': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(query_duration_ms) AS query_duration_ms,
           ROUND(query_duration_ms / 1000, 2) AS query_duration_s
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY event_time
    ORDER BY event_time ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
    }
  },

  'query-memory': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(memory_usage) AS memory_usage,
           formatReadableSize(memory_usage) AS readable_memory_usage
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY event_time
    ORDER BY event_time ASC
  `,
    }
  },

  'query-type': ({ lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT type,
           COUNT() AS query_count
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY 1
    ORDER BY 1
  `,
    }
  },

  'query-cache': () => ({
    query: `
    SELECT
      sumIf(result_size, stale = 0) AS total_result_size,
      sumIf(result_size, stale = 1) AS total_staled_result_size,
      formatReadableSize(total_result_size) AS readable_total_result_size,
      formatReadableSize(total_staled_result_size) AS readable_total_staled_result_size
    FROM system.query_cache
  `,
  }),

  // v24.1+: Query cache usage stats from query_log
  'query-cache-usage': ({ lastHours = 24 * 7 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT
      query_cache_usage,
      COUNT() AS query_count,
      round(100 * query_count / sum(query_count) OVER (), 2) AS percentage
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY query_cache_usage
    ORDER BY query_count DESC
  `,
      // Fallback for pre-24.1 versions
      variants: [
        {
          versions: { maxVersion: '24.1' },
          query: `SELECT 'Not available' AS query_cache_usage, 0 AS query_count, 0 AS percentage`,
          description: 'query_cache_usage column not available before v24.1',
        },
      ],
    }
  },

  'failed-query-count': ({
    interval = 'toStartOfMinute',
    lastHours = 24 * 7,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge('system', '^query_log')
      WHERE
            type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
            ${timeFilter ? `AND ${timeFilter}` : ''}
      GROUP BY 1
      ORDER BY 1
    ),
    query_type AS (
        SELECT ${applyInterval(interval, 'event_time')},
               type AS query_type,
               COUNT() AS count
        FROM merge('system', '^query_log')
        WHERE
              type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
              ${timeFilter ? `AND ${timeFilter}` : ''}
        GROUP BY 1, 2
        ORDER BY 3 DESC
    ),
    breakdown AS (
      SELECT event_time,
             groupArray((query_type, count)) AS breakdown
      FROM query_type
      GROUP BY 1
    )
    SELECT event_time,
           query_count,
           breakdown.breakdown AS breakdown
    FROM event_count
    LEFT JOIN breakdown USING event_time
    ORDER BY 1
  `,
    }
  },

  'failed-query-count-by-user': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           countDistinct(query_id) AS count
    FROM merge('system', '^query_log')
    WHERE
          type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
          ${timeFilter ? `AND ${timeFilter}` : ''}
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `,
    }
  },
}
