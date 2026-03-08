'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartOomKilledQueries = createAreaChart({
  chartName: 'oom-killed-queries',
  index: 'event_time',
  categories: ['kill_count'],
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'oom-killed-queries-chart',
  dateRangeConfig: 'system-metrics',
  areaChartProps: {
    colors: ['--chart-11'],
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export type ChartOomKilledQueriesProps = ChartProps

export default ChartOomKilledQueries
