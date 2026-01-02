'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartConnectionsHttp = createBarChart({
  chartName: 'connections-http',
  index: 'event_time',
  categories: [
    'CurrentMetric_HTTPConnectionsTotal',
    'CurrentMetric_HTTPConnection',
  ],
  defaultTitle: 'HTTP Connections',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  xAxisDateFormat: true,
  dateRangeConfig: 'health',
  barChartProps: {
    stack: true,
    showLabel: false,
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartConnectionsHttpProps = ChartProps

export default ChartConnectionsHttp
