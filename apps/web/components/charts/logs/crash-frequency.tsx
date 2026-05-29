'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartCrashFrequency = createBarChart({
  chartName: 'crash-frequency',
  index: 'event_time',
  categories: ['crash_count'],
  defaultTitle: 'Crash Frequency',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 30,
  dataTestId: 'crash-frequency-chart',
  dateRangeConfig: 'query-activity',
  xAxisDateFormat: true,
  barChartProps: {
    showLegend: false,
    showXAxis: true,
    showGridLines: true,
    colors: ['--chart-red'],
  },
})

export type ChartCrashFrequencyProps = ChartProps

export default ChartCrashFrequency
