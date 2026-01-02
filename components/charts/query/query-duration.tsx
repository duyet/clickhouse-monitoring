'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartQueryDuration = createBarChart({
  chartName: 'query-duration',
  index: 'event_time',
  categories: ['query_duration_s'],
  defaultTitle: 'Query Duration',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-duration-chart',
  dateRangeConfig: 'query-duration',
  barChartProps: {
    colors: ['--chart-rose-200'],
    colorLabel: '--foreground',
    stack: true,
    showLegend: false,
  },
})

export type ChartQueryDurationProps = ChartProps

export default ChartQueryDuration
