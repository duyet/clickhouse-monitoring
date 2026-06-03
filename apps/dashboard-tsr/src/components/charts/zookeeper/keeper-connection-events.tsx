import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

/**
 * Keeper connect/disconnect events over time — disconnect spikes signal
 * session instability. From system.zookeeper_connection_log.
 */
export const ChartKeeperConnectionEvents = createBarChart({
  chartName: 'keeper-connection-events',
  index: 'event_time',
  categories: ['connected', 'disconnected'],
  defaultTitle: 'Keeper Connection Events',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 14,
  dataTestId: 'keeper-connection-events-chart',
  dateRangeConfig: 'health',
  xAxisDateFormat: true,
  barChartProps: {
    stack: true,
    showLegend: true,
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartKeeperConnectionEventsProps = ChartProps

export default ChartKeeperConnectionEvents
