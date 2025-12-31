'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { createBarChart } from '@/components/charts/factory'

export const ChartQueryDuration = createBarChart<{
  event_time: string
  query_duration_ms: number
  query_duration_s: number
}>({
  chartName: 'query-duration',
  index: 'event_time',
  categories: ['query_duration_s'],
  defaultTitle:
    'Avg Queries Duration over last 14 days (AVG(duration in seconds) / day)',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-duration-chart',
  barChartProps: {
    colors: ['--chart-rose-200'],
    colorLabel: '--foreground',
    stack: true,
    showLegend: false,
  },
})

export type ChartQueryDurationProps = ChartProps

export default ChartQueryDuration
