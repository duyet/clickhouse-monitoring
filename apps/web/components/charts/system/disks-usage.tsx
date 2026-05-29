'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartDisksUsage = createAreaChart({
  chartName: 'disks-usage',
  index: 'event_time',
  categories: ['DiskAvailable_default', 'DiskUsed_default'],
  defaultTitle: 'Disks Usage',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 30,
  dataTestId: 'disk-usage-chart',
  dateRangeConfig: 'disk-usage',
  areaChartProps: {
    readableColumns: [
      'readable_DiskAvailable_default',
      'readable_DiskUsed_default',
    ],
    stack: true,
    yAxisTickFormatter: chartTickFormatters.bytes,
  },
})

export type ChartDisksUsageProps = ChartProps

export default ChartDisksUsage
