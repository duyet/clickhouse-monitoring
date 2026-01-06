'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartCPUUsage = createAreaChart({
  chartName: 'cpu-usage',
  index: 'event_time',
  categories: ['avg_cpu'],
  defaultInterval: 'toStartOfTenMinutes',
  defaultLastHours: 24,
  dataTestId: 'cpu-usage-chart',
  dateRangeConfig: 'system-metrics',
  areaChartProps: {
    colors: ['--chart-1'],
    yAxisTickFormatter: chartTickFormatters.duration,
  },
})

export type ChartCPUUsageProps = ChartProps

export default ChartCPUUsage
