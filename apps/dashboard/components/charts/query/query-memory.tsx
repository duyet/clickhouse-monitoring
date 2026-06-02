'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartQueryMemory = createAreaChart({
  chartName: 'query-memory',
  index: 'event_time',
  categories: ['memory_usage'],
  defaultTitle: 'Query Memory Usage',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'query-memory-chart',
  dateRangeConfig: 'query-duration',
  areaChartProps: {
    readableColumn: 'readable_memory_usage',
    stack: true,
    showLegend: false,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-indigo-300'],
    yAxisTickFormatter: chartTickFormatters.bytes,
  },
})

export type ChartQueryMemoryProps = ChartProps

export default ChartQueryMemory
