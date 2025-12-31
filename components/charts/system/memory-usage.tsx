'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartMemoryUsage = createAreaChart<{
  event_time: string
  avg_memory: number
  readable_avg_memory: string
}>({
  chartName: 'memory-usage',
  index: 'event_time',
  categories: ['avg_memory'],
  defaultInterval: 'toStartOfTenMinutes',
  defaultLastHours: 24,
  dataTestId: 'memory-usage-chart',
  areaChartProps: {
    colors: ['--chart-12'],
    yAxisTickFormatter: chartTickFormatters.bytes,
  },
})

export type ChartMemoryUsageProps = ChartProps

export default ChartMemoryUsage
