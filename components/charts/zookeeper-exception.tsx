'use client'

import { createBarChart } from '@/components/charts/factory'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartKeeperException = createBarChart<{
  event_time: string
  KEEPER_EXCEPTION: number
}>({
  chartName: 'zookeeper-exception',
  index: 'event_time',
  categories: ['KEEPER_EXCEPTION'],
  defaultTitle: 'KEEPER_EXCEPTION last 7 days',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'zookeeper-exception-chart',
  barChartProps: {
    showLegend: true,
    stack: true,
  },
})

export type ChartKeeperExceptionProps = ChartProps
