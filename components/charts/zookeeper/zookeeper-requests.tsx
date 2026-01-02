'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartZookeeperRequests = createBarChart({
  chartName: 'zookeeper-requests',
  index: 'event_time',
  categories: ['ZookeeperRequests', 'ZooKeeperWatch'],
  defaultTitle: 'ZooKeeper Requests',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'zookeeper-requests-chart',
  dateRangeConfig: 'health',
  xAxisDateFormat: true,
  barChartProps: {
    showLegend: true,
    stack: true,
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartZookeeperRequestsProps = ChartProps

export default ChartZookeeperRequests
