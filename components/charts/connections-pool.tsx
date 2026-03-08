'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartConnectionsPool = createAreaChart({
  chartName: 'connections-pool',
  index: 'event_time',
  categories: ['TCPConnection', 'HTTPConnection', 'InterserverConnection'],
  defaultTitle: 'Connection Pool',
  defaultInterval: 'toStartOfFiveMinutes',
  defaultLastHours: 24,
  dateRangeConfig: 'health',
  areaChartProps: {
    showLegend: true,
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartConnectionsPoolProps = ChartProps

export default ChartConnectionsPool
