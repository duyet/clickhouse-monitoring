'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartMergeSumReadRows = createBarChart({
  chartName: 'merge-sum-read-rows',
  index: 'event_time',
  categories: ['sum_read_rows_scale'],
  defaultTitle: 'Merge Read Rows',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 14,
  dataTestId: 'merge-sum-read-rows-chart',
  dateRangeConfig: 'operations',
  barChartProps: {
    readableColumn: 'readable_sum_read_rows',
    labelPosition: 'inside',
    labelAngle: -90,
    colorLabel: '--foreground',
    colors: ['--chart-indigo-300'],
    autoMinValue: true,
    relative: false,
    allowDecimals: true,
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartMergeSumReadRowsProps = ChartProps

export default ChartMergeSumReadRows
