'use client'

import { createBarChart } from '@/components/charts/factory'

export const TopPagesChart = createBarChart({
  chartName: 'top-pages',
  index: 'url',
  categories: ['views'],
  defaultTitle: 'Top Pages',
  dataTestId: 'top-pages-chart',
  barChartProps: {
    layout: 'horizontal',
    showLegend: false,
    showXAxis: false,
    showYAxis: false,
  },
})
