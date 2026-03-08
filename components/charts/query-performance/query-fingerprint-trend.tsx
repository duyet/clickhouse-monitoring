'use client'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartQueryFingerprintTrend = createAreaChart({
  chartName: 'query-fingerprint-trend',
  index: 'event_time',
  categories: ['avg_duration_ms', 'p95_duration_ms'],
  defaultTitle: 'Query Duration Trend',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-fingerprint-trend-chart',
  dateRangeConfig: 'query-activity',
  areaChartProps: {
    readable: 'duration',
    stack: false,
    showLegend: true,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-blue-300', '--chart-orange-300'],
    yAxisTickFormatter: chartTickFormatters.duration,
  },
})

export default ChartQueryFingerprintTrend
