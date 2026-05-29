'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartQueryMemory = createBarChart({
  chartName: 'query-memory',
  index: 'event_time',
  categories: ['memory_usage'],
  defaultTitle: 'Query Memory Usage',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-memory-chart',
  dateRangeConfig: 'query-duration',
  barChartProps: {
    readableColumn: 'readable_memory_usage',
    stack: true,
    showLegend: false,
    showLabel: false,
    colors: ['--chart-indigo-300'],
    yAxisTickFormatter: chartTickFormatters.bytes,
  },
})

export type ChartQueryMemoryProps = ChartProps

export default ChartQueryMemory
