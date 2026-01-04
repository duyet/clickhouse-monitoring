'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartMergeAvgDuration = createBarChart({
  chartName: 'merge-avg-duration',
  index: 'event_time',
  categories: ['avg_duration_ms'],
  defaultTitle: 'Merge Avg Duration',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'merge-avg-duration-chart',
  dateRangeConfig: 'operations',
  barChartProps: {
    readableColumn: 'readable_avg_duration_ms',
    showLabel: false,
    yAxisTickFormatter: chartTickFormatters.duration,
  },
})

export type ChartMergeAvgDurationProps = ChartProps

export default ChartMergeAvgDuration
