'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartZookeeperWait = createBarChart({
  chartName: 'zookeeper-wait',
  index: 'event_time',
  categories: ['AVG_ProfileEvent_ZooKeeperWaitSeconds'],
  defaultTitle: 'ZooKeeper Wait',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'zookeeper-wait-chart',
  dateRangeConfig: 'health',
  xAxisDateFormat: true,
  barChartProps: {
    readableColumn: 'readable_AVG_ProfileEvent_ZooKeeperWaitSeconds',
    showLegend: true,
    stack: true,
  },
})

export type ChartZookeeperWaitProps = ChartProps

export default ChartZookeeperWait
