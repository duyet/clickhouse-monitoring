'use client'

import { createBarChart } from '@/components/charts/factory'

export const PageviewsByDeviceChart = createBarChart({
  chartName: 'pageviews-by-device',
  index: 'device',
  categories: ['views'],
  defaultTitle: 'Pageviews by Device',
  dataTestId: 'pageviews-by-device-chart',
  barChartProps: {
    layout: 'horizontal',
    showLegend: false,
    showXAxis: false,
    showYAxis: false,
  },
})
