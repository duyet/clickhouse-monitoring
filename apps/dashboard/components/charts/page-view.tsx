'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const PageViewBarChart = createBarChart({
  chartName: 'page-view',
  index: 'event_time',
  categories: ['page_views'],
  defaultTitle: 'Page Views',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 30,
  dataTestId: 'page-view-chart',
  dateRangeConfig: 'page-views',
  barChartProps: {
    showLegend: false,
    showXAxis: true,
    showYAxis: true,
    showLabel: true,
    colors: ['--chart-indigo-300'],
  },
})

export type PageViewBarChartProps = ChartProps

export default PageViewBarChart
