'use client'

import { createBarChart } from '@/components/charts/factory'

export const PageviewsByCountryChart = createBarChart({
  chartName: 'pageviews-by-country',
  index: 'country',
  categories: ['views'],
  defaultTitle: 'Pageviews by Country',
  dataTestId: 'pageviews-by-country-chart',
  barChartProps: {
    layout: 'horizontal',
    showLegend: false,
    showXAxis: false,
    showYAxis: false,
  },
})
