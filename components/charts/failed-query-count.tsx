'use client'

import { createAreaChart } from '@/components/charts/factory'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartFailedQueryCount = createAreaChart<{
  event_time: string
  query_count: number
  breakdown: Array<[string, number] | Record<string, string>>
}>({
  chartName: 'failed-query-count',
  index: 'event_time',
  categories: ['query_count'],
  defaultInterval: 'toStartOfMinute',
  defaultLastHours: 24 * 7,
  dataTestId: 'failed-query-count-chart',
  areaChartProps: {
    readable: 'quantity',
    stack: true,
    showLegend: false,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-1'],
    breakdown: 'breakdown',
    breakdownLabel: 'query_type',
    breakdownValue: 'count',
  },
})

export type ChartFailedQueryCountProps = ChartProps

export default ChartFailedQueryCount
