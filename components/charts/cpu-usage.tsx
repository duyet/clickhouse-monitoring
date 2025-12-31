'use client'

import { createAreaChart } from '@/components/charts/factory'
import type { ChartProps } from '@/components/charts/chart-props'
import { chartTickFormatters } from '@/lib/utils'

export const ChartCPUUsage = createAreaChart<{
  event_time: string
  avg_cpu: number
}>({
  chartName: 'cpu-usage',
  index: 'event_time',
  categories: ['avg_cpu'],
  defaultInterval: 'toStartOfTenMinutes',
  defaultLastHours: 24,
  dataTestId: 'cpu-usage-chart',
  areaChartProps: {
    colors: ['--chart-1'],
    yAxisTickFormatter: chartTickFormatters.duration,
  },
})

export type ChartCPUUsageProps = ChartProps

export default ChartCPUUsage
