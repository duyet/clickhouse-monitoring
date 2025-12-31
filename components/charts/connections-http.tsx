'use client'

import { createBarChart } from '@/components/charts/factory'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartConnectionsHttp = createBarChart<{
  event_time: string
  CurrentMetric_HTTPConnection: number
  readable_CurrentMetric_HTTPConnection: string
  CurrentMetric_HTTPConnectionsTotal: number
  readable_CurrentMetric_HTTPConnectionsTotal: string
}>({
  chartName: 'connections-http',
  index: 'event_time',
  categories: [
    'CurrentMetric_HTTPConnectionsTotal',
    'CurrentMetric_HTTPConnection',
  ],
  defaultTitle: 'HTTP Connections Last 7 days (Total Requests / Hour)',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  barChartProps: {
    stack: true,
    showLabel: false,
  },
})

export type ChartConnectionsHttpProps = ChartProps

export default ChartConnectionsHttp
