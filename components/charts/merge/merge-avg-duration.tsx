'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { createBarChart } from '@/components/charts/factory'

export const ChartMergeAvgDuration = createBarChart<{
  event_time: string
  avg_duration_ms: number
  readable_avg_duration_ms: string
  bar: number
}>({
  chartName: 'merge-avg-duration',
  index: 'event_time',
  categories: ['avg_duration_ms'],
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'merge-avg-duration-chart',
  barChartProps: {
    readableColumn: 'readable_avg_duration_ms',
    showLabel: false,
  },
})

export type ChartMergeAvgDurationProps = ChartProps

export default ChartMergeAvgDuration
