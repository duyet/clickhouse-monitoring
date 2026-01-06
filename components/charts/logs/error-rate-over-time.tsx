'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartErrorRateOverTime = createAreaChart({
  chartName: 'error-rate-over-time',
  index: 'event_time',
  categories: ['error_count', 'warning_count', 'info_count'],
  defaultTitle: 'Error Rate Over Time',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24,
  dataTestId: 'error-rate-over-time-chart',
  dateRangeConfig: 'realtime',
  areaChartProps: {
    readable: 'quantity',
    stack: true,
    showLegend: true,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-red', '--chart-yellow', '--chart-blue'],
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartErrorRateOverTimeProps = ChartProps

export default ChartErrorRateOverTime
