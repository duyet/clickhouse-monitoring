import type { DeclarativeQueryConfig } from '../../schema'

export const histogramMetricsDeclarative: DeclarativeQueryConfig = {
  name: 'histogram-metrics',
  defaultView: 'auto',
  card: { primary: 'table', badges: ['metric'] },
  description:
    'Instant histogram snapshots for latency and throughput metrics (system.histogram_metrics, CH 25.1+). Shows Keeper request stages, query durations, and other distribution metrics.',
  refreshInterval: 15_000,
  optional: true,
  tableCheck: 'system.histogram_metrics',
  sql: [
    {
      since: '25.1',
      description: 'Histogram metrics with count, avg, min, max',
      sql: `
        SELECT
          metric,
          count,
          formatReadableQuantity(count) AS readable_count,
          round(count * 100.0 / nullIf(max(count) OVER (), 0), 2) AS pct_count,
          round(if(count > 0, sum / count, 0), 2) AS avg_value,
          minimum AS min_value,
          maximum AS max_value,
          sum
        FROM system.histogram_metrics
        ORDER BY count DESC
      `,
    },
  ],
  columns: [
    'metric',
    'readable_count',
    'avg_value',
    'min_value',
    'max_value',
    'sum',
  ],
  columnFormats: {
    metric: 'colored-badge',
    readable_count: 'background-bar',
  },
}
