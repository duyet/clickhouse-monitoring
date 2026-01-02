import type { ChartQueryBuilder } from './types'
import { applyInterval, buildTimeFilter, fillStep, nowOrToday } from './types'

export const threadCharts: Record<string, ChartQueryBuilder> = {
  'thread-utilization': ({ interval = 'toStartOfHour', lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
        SELECT ${applyInterval(interval, 'event_time')},
               count(DISTINCT thread_id) as active_threads,
               avg(memory_usage) as avg_memory,
               max(peak_memory_usage) as max_peak_memory
        FROM system.query_thread_log
        WHERE 1=1
              ${timeFilter ? `AND ${timeFilter}` : ''}
        GROUP BY event_time
        ORDER BY event_time
        WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
      `,
      optional: true,
      tableCheck: 'system.query_thread_log',
    }
  },

  'parallelization-efficiency': ({ lastHours = 24 * 7 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
        SELECT
          multiIf(
            thread_count = 1, '1 thread',
            thread_count <= 4, '2-4 threads',
            thread_count <= 8, '5-8 threads',
            thread_count <= 16, '9-16 threads',
            '17+ threads'
          ) as thread_bucket,
          count() as query_count
        FROM (
          SELECT query_id, count() as thread_count
          FROM system.query_thread_log
          WHERE 1=1
                ${timeFilter ? `AND ${timeFilter}` : ''}
          GROUP BY query_id
        )
        GROUP BY thread_bucket
        ORDER BY query_count DESC
      `,
      optional: true,
      tableCheck: 'system.query_thread_log',
    }
  },

  'cpu-time-per-thread': ({ interval = 'toStartOfHour', lastHours = 24 }) => {
    const timeFilter = buildTimeFilter(lastHours)
    return {
      query: `
        SELECT ${applyInterval(interval, 'event_time')},
               avg(ProfileEvents['OSCPUVirtualTimeMicroseconds']) as avg_cpu_time_us,
               avg(ProfileEvents['RealTimeMicroseconds']) as avg_real_time_us
        FROM system.query_thread_log
        WHERE 1=1
              ${timeFilter ? `AND ${timeFilter}` : ''}
        GROUP BY event_time
        ORDER BY event_time
        WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
      `,
      optional: true,
      tableCheck: 'system.query_thread_log',
    }
  },
}
