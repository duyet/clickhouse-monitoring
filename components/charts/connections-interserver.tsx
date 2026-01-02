'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartConnectionsInterserver = createBarChart({
  chartName: 'connections-interserver',
  index: 'event_time',
  categories: ['CurrentMetric_InterserverConnection'],
  defaultTitle: 'Interserver Connections',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  xAxisDateFormat: true,
  dateRangeConfig: 'health',
  barChartProps: {
    readableColumn: 'readable_CurrentMetric_InterserverConnection',
    stack: true,
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartConnectionsInterserverProps = ChartProps

export default ChartConnectionsInterserver
