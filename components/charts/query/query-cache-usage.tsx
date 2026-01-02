'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

/**
 * Query Cache Usage Chart
 * Shows query cache hit rate breakdown by usage type (Read, Write, None)
 * Available in ClickHouse v24.1+
 */
export const ChartQueryCacheUsage = createBarChart<{
  query_cache_usage: string
  query_count: number
  percentage: number
}>({
  chartName: 'query-cache-usage',
  index: 'query_cache_usage',
  categories: ['percentage'],
  defaultTitle: 'Query Cache Hit Rate',
  defaultLastHours: 24 * 7,
  dataTestId: 'query-cache-usage-chart',
  barChartProps: {
    showLegend: false,
    stack: false,
    showLabel: true,
    colors: ['--chart-green-300'],
  },
})

export type ChartQueryCacheUsageProps = ChartProps

export default ChartQueryCacheUsage
