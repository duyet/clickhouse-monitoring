'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'

export const ChartKeeperWaitTime = createAreaChart({
  chartName: 'keeper-wait-time',
  index: 'event_time',
  categories: ['wait_ms'],
  defaultInterval: 'toStartOfFifteenMinutes',
  defaultLastHours: 24,
  dataTestId: 'keeper-wait-time-chart',
  dateRangeConfig: 'system-metrics',
  areaChartProps: {
    colors: ['--chart-3'],
  },
})

export type ChartKeeperWaitTimeProps = ChartProps

export default ChartKeeperWaitTime
