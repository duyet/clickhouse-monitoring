'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartLoginSuccessRate = createAreaChart({
  chartName: 'login-success-rate',
  index: 'event_time',
  categories: ['success_count', 'failure_count'],
  defaultTitle: 'Login Activity',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'login-success-rate-chart',
  dateRangeConfig: 'system-metrics',
  areaChartProps: {
    stack: true,
    showLegend: true,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-10', '--chart-8'],
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartLoginSuccessRateProps = ChartProps

export default ChartLoginSuccessRate
