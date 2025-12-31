'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { createBarChart } from '@/components/charts/factory'

export const ChartConnectionsInterserver = createBarChart<{
  event_time: string
  CurrentMetric_InterserverConnection: number
  readable_CurrentMetric_InterserverConnection: string
}>({
  chartName: 'connections-interserver',
  index: 'event_time',
  categories: ['CurrentMetric_InterserverConnection'],
  defaultTitle: 'Interserver Connections Last 7 days (Total Requests / Hour)',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  barChartProps: {
    readableColumn: 'readable_CurrentMetric_InterserverConnection',
    stack: true,
  },
})

export type ChartConnectionsInterserverProps = ChartProps

export default ChartConnectionsInterserver
