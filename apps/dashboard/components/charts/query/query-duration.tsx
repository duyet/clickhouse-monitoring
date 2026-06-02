'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'

export const ChartQueryDuration = createAreaChart({
  chartName: 'query-duration',
  index: 'event_time',
  categories: ['query_duration_s'],
  defaultTitle: 'Query Duration',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-duration-chart',
  dateRangeConfig: 'query-duration',
  areaChartProps: {
    colors: ['--chart-rose-200'],
    stack: true,
    showLegend: false,
    showXAxis: true,
    showCartesianGrid: true,
  },
})

export type ChartQueryDurationProps = ChartProps

export default ChartQueryDuration
