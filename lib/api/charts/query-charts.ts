/**
 * Query Monitoring Charts
 * Charts for tracking query performance, counts, and memory usage
 */

import type { ChartQueryBuilder } from './types'
import { applyInterval, fillStep, nowOrToday } from './types'

export const queryCharts: Record<string, ChartQueryBuilder> = {
  'query-count': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => ({
    query: `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge('system', '^query_log')
      WHERE type = 'QueryFinish'
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
      GROUP BY event_time
      ORDER BY event_time WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
    ),
    query_kind AS (
      SELECT ${applyInterval(interval, 'event_time')},
               query_kind,
               COUNT() AS count
        FROM merge('system', '^query_log')
        WHERE type = 'QueryFinish'
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
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
  }),

  'query-count-by-user': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           COUNT(*) AS count
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
          AND user != ''
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `,
  }),

  'query-duration': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(query_duration_ms) AS query_duration_ms,
           ROUND(query_duration_ms / 1000, 2) AS query_duration_s
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          AND query_kind = 'Select'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'query-memory': ({ interval = 'toStartOfDay', lastHours = 24 * 14 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           AVG(memory_usage) AS memory_usage,
           formatReadableSize(memory_usage) AS readable_memory_usage
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          AND query_kind = 'Select'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY event_time
    ORDER BY event_time ASC
  `,
  }),

  'query-type': ({ lastHours = 24 }) => ({
    query: `
    SELECT type,
           COUNT() AS query_count
    FROM merge('system', '^query_log')
    WHERE type = 'QueryFinish'
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
  `,
  }),

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

  'failed-query-count': ({
    interval = 'toStartOfMinute',
    lastHours = 24 * 7,
  }) => ({
    query: `
    WITH event_count AS (
      SELECT ${applyInterval(interval, 'event_time')},
             COUNT() AS query_count
      FROM merge('system', '^query_log')
      WHERE
            type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
            AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
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
              AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
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
  }),

  'failed-query-count-by-user': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           user,
           countDistinct(query_id) AS count
    FROM merge('system', '^query_log')
    WHERE
          type IN ['ExceptionBeforeStart', 'ExceptionWhileProcessing']
          AND event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1, 2
    ORDER BY
      1 ASC,
      3 DESC
  `,
  }),
}
