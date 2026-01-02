'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartFailedQueryCount = createAreaChart({
  chartName: 'failed-query-count',
  index: 'event_time',
  categories: ['query_count'],
  defaultInterval: 'toStartOfMinute',
  defaultLastHours: 24 * 7,
  dataTestId: 'failed-query-count-chart',
  dateRangeConfig: 'query-activity',
  areaChartProps: {
    readable: 'quantity',
    stack: true,
    showLegend: false,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-1'],
    breakdown: 'breakdown',
    breakdownLabel: 'query_type',
    breakdownValue: 'count',
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartFailedQueryCountProps = ChartProps

export default ChartFailedQueryCount
