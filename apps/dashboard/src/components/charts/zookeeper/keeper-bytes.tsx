import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

/**
 * Keeper network throughput over time — bytes sent to / received from
 * Keeper/ZooKeeper, from metric_log ProfileEvents.
 */
export const ChartKeeperBytes = createAreaChart({
  chartName: 'keeper-bytes',
  index: 'event_time',
  categories: ['bytes_sent', 'bytes_received'],
  defaultTitle: 'Keeper Network Throughput',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'keeper-bytes-chart',
  dateRangeConfig: 'health',
  areaChartProps: {
    showLegend: true,
    yAxisTickFormatter: chartTickFormatters.bytes,
  },
})

export type ChartKeeperBytesProps = ChartProps

export default ChartKeeperBytes
