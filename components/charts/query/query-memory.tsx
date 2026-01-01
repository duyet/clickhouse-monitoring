'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartQueryMemory = createBarChart<{
  event_time: string
  memory_usage: number
  readable_memory_usage: string
}>({
  chartName: 'query-memory',
  index: 'event_time',
  categories: ['memory_usage'],
  defaultTitle: 'Avg Memory Usage for queries over last 14 days',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-memory-chart',
  barChartProps: {
    readableColumn: 'readable_memory_usage',
    stack: true,
    showLegend: false,
    showLabel: false,
    colors: ['--chart-indigo-300'],
  },
})

export type ChartQueryMemoryProps = ChartProps

export default ChartQueryMemory
