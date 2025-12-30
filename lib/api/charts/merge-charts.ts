/**
 * Merge Operation Charts
 * Charts for tracking merge performance and resource usage
 */

import type { ChartQueryBuilder } from './types'
import { applyInterval, fillStep, nowOrToday } from './types'

export const mergeCharts: Record<string, ChartQueryBuilder> = {
  'merge-count': ({ interval = 'toStartOfFiveMinutes', lastHours = 12 }) => ({
    query: `
    SELECT ${applyInterval(interval, 'event_time')},
           avg(CurrentMetric_Merge) AS avg_CurrentMetric_Merge,
           avg(CurrentMetric_PartMutation) AS avg_CurrentMetric_PartMutation
    FROM merge('system', '^metric_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
    GROUP BY 1
    ORDER BY 1
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'merge-avg-duration': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT
        ${applyInterval(interval, 'event_time')},
        AVG(duration_ms) AS avg_duration_ms,
        formatReadableTimeDelta(avg_duration_ms / 1000, 'seconds', 'milliseconds') AS readable_avg_duration_ms,
        bar(avg_duration_ms, 0, MAX(avg_duration_ms) OVER ()) AS bar
    FROM merge('system', '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'merge-sum-read-rows': ({
    interval = 'toStartOfDay',
    lastHours = 24 * 14,
  }) => ({
    query: `
    SELECT
        ${applyInterval(interval, 'event_time')},
        SUM(read_rows) AS sum_read_rows,
        log10(sum_read_rows) * 100 AS sum_read_rows_scale,
        formatReadableQuantity(sum_read_rows) AS readable_sum_read_rows
    FROM merge('system', '^part_log')
    WHERE event_time >= (now() - INTERVAL ${lastHours} HOUR)
      AND event_type = 'MergeParts'
      AND merge_reason = 'RegularMerge'
    GROUP BY 1
    ORDER BY 1 ASC
    WITH FILL TO ${nowOrToday(interval)} STEP ${fillStep(interval)}
  `,
  }),

  'summary-used-by-merges': () => ({
    queries: [
      {
        key: 'used',
        query: `
          SELECT
            SUM(memory_usage) as memory_usage,
            formatReadableSize(memory_usage) as readable_memory_usage
          FROM system.merges
        `,
      },
      {
        key: 'totalMem',
        query: `
          SELECT metric, value as total, formatReadableSize(total) AS readable_total
          FROM system.asynchronous_metrics
          WHERE
              metric = 'CGroupMemoryUsed'
              OR metric = 'OSMemoryTotal'
          ORDER BY metric ASC
          LIMIT 1
        `,
      },
      {
        key: 'rowsReadWritten',
        query: `
          SELECT SUM(rows_read) as rows_read,
                 SUM(rows_written) as rows_written,
                 formatReadableQuantity(rows_read) as readable_rows_read,
                 formatReadableQuantity(rows_written) as readable_rows_written
          FROM system.merges
        `,
      },
      {
        key: 'bytesReadWritten',
        query: `
          SELECT SUM(bytes_read_uncompressed) as bytes_read,
                 SUM(bytes_written_uncompressed) as bytes_written,
                 formatReadableSize(bytes_read) as readable_bytes_read,
                 formatReadableSize(bytes_written) as readable_bytes_written
          FROM system.merges
        `,
      },
    ],
  }),
}
