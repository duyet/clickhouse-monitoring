'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createAreaChart } from '@/components/charts/factory'

export const ChartQueryDurationPercentiles = createAreaChart({
  chartName: 'query-duration-percentiles',
  index: 'event_time',
  categories: ['p50_s', 'p95_s', 'p99_s'],
  defaultTitle: 'Query Duration Percentiles',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-duration-percentiles-chart',
  dateRangeConfig: 'query-duration',
  areaChartProps: {
    stack: false,
    showLegend: true,
    showXAxis: true,
    showCartesianGrid: true,
    yAxisTickFormatter: (v: string | number) => `${v}s`,
  },
})

export type ChartQueryDurationPercentilesProps = ChartProps

export default ChartQueryDurationPercentiles
