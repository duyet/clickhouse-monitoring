'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { createAreaChart } from '@/components/charts/factory'

export const ChartQueryCount = createAreaChart<{
  event_time: string
  query_count: number
  breakdown: Array<[string, number] | Record<string, string>>
}>({
  chartName: 'query-count',
  index: 'event_time',
  categories: ['query_count'],
  defaultTitle: 'Running Queries over last 14 days (query / day)',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-count-chart',
  areaChartProps: {
    readable: 'quantity',
    stack: true,
    showLegend: false,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-yellow'],
    breakdown: 'breakdown',
    breakdownLabel: 'query_kind',
    breakdownValue: 'count',
  },
})

export type ChartQueryCountProps = ChartProps

export default ChartQueryCount
