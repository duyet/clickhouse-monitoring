'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartKeeperException = createBarChart({
  chartName: 'zookeeper-exception',
  index: 'event_time',
  categories: ['KEEPER_EXCEPTION'],
  defaultTitle: 'Keeper Exceptions',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'zookeeper-exception-chart',
  dateRangeConfig: 'health',
  barChartProps: {
    showLegend: true,
    stack: true,
  },
})

export type ChartKeeperExceptionProps = ChartProps
