'use client'

import { createBarChart } from '@/components/charts/factory'
import type { ChartProps } from '@/components/charts/chart-props'

export const ChartMergeSumReadRows = createBarChart<{
  event_time: string
  sum_read_rows: number
  sum_read_rows_scale: number
  readable_sum_read_rows: string
}>({
  chartName: 'merge-sum-read-rows',
  index: 'event_time',
  categories: ['sum_read_rows_scale'],
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'merge-sum-read-rows-chart',
  barChartProps: {
    readableColumn: 'readable_sum_read_rows',
    labelPosition: 'inside',
    labelAngle: -90,
    colorLabel: '--foreground',
    colors: ['--chart-indigo-300'],
    autoMinValue: true,
    relative: false,
    allowDecimals: true,
  },
})

export type ChartMergeSumReadRowsProps = ChartProps

export default ChartMergeSumReadRows
