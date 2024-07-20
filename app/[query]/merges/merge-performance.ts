import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

export const mergePerformanceConfig: QueryConfig = {
  name: 'merge-performance',
  description: 'Merge performance over day, avg duration, avg rows read',
  sql: `
      SELECT
          event_date,
          merge_reason,

          -- Merge Count
          count() AS count,

          -- Merge Duration
          AVG(duration_ms) AS avg_duration_ms,
          formatReadableTimeDelta(avg_duration_ms / 1000) AS readable_avg_duration,
          round(100 * avg_duration_ms / max(avg_duration_ms) OVER ()) as pct_avg_duration,

          -- Rows Read
          SUM(read_rows) AS sum_read_rows,
          formatReadableQuantity(sum_read_rows) AS readable_sum_read_rows,
          round(100 * sum_read_rows / max(sum_read_rows) OVER ()) as pct_sum_read_rows,

          bar(avg_duration_ms, 0, max(avg_duration_ms) OVER (), 30) AS bar_avg_duration,
          bar(sum_read_rows, 0, max(sum_read_rows) OVER (), 30) AS bar_sum_read_rows
      FROM merge(system, '^part_log')
      WHERE (event_type = 'MergeParts')
        AND (merge_reason = 'RegularMerge')
      GROUP BY 1, 2
      ORDER BY 1, 2 ASC
    `,
  columns: [
    'event_date',
    'merge_reason',
    'readable_avg_duration',
    'readable_sum_read_rows',
  ],
  columnFormats: {
    merge_reason: ColumnFormat.ColoredBadge,
    readable_avg_duration: ColumnFormat.BackgroundBar,
    readable_sum_read_rows: ColumnFormat.BackgroundBar,
  },
  relatedCharts: [
    [
      'merge-avg-duration',
      {
        title: 'Merge Avg Duration in last 30 days',
        lastHours: 24 * 30,
      },
    ],
    [
      'merge-sum-read-rows',
      {
        title: 'Merge Total Read Rows in last 30 days',
        lastHours: 24 * 30,
      },
    ],
  ],
}
