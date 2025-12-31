'use client'

import { createAreaChart } from '@/components/charts/factory'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartDisksUsage = createAreaChart<{
  event_time: string
  DiskAvailable_default: number
  DiskUsed_default: number
  readable_DiskAvailable_default: string
  readable_DiskUsed_default: string
}>({
  chartName: 'disks-usage',
  index: 'event_time',
  categories: ['DiskAvailable_default', 'DiskUsed_default'],
  defaultTitle: 'Disks Usage over last 30 days',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 30,
  dataTestId: 'disk-usage-chart',
  areaChartProps: {
    readableColumns: [
      'readable_DiskAvailable_default',
      'readable_DiskUsed_default',
    ],
    stack: true,
  },
})

export type ChartDisksUsageProps = ChartProps

export default ChartDisksUsage
