'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartThreadUtilization = createAreaChart({
  chartName: 'thread-utilization',
  index: 'event_time',
  categories: ['active_threads', 'avg_memory', 'max_peak_memory'],
  defaultTitle: 'Thread Utilization',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24,
  dataTestId: 'thread-utilization-chart',
  dateRangeConfig: 'realtime',
  areaChartProps: {
    readable: 'quantity',
    stack: false,
    showLegend: true,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-blue', '--chart-green', '--chart-red'],
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartThreadUtilizationProps = ChartProps

export default ChartThreadUtilization
