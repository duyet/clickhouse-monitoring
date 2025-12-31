'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { createBarChart } from '@/components/charts/factory'

export const ChartZookeeperRequests = createBarChart<{
  event_time: string
  ZookeeperRequests: number
  ZooKeeperWatch: number
}>({
  chartName: 'zookeeper-requests',
  index: 'event_time',
  categories: ['ZookeeperRequests', 'ZooKeeperWatch'],
  defaultTitle: 'ZooKeeper Requests Over Time',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'zookeeper-requests-chart',
  barChartProps: {
    showLegend: true,
    stack: true,
  },
})

export type ChartZookeeperRequestsProps = ChartProps

export default ChartZookeeperRequests
