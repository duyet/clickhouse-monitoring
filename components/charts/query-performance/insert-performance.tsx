'use client'

import { createAreaChart } from '@/components/charts/factory'
import { chartTickFormatters } from '@/lib/utils'

export const ChartInsertPerformance = createAreaChart({
  chartName: 'insert-performance',
  index: 'event_time',
  categories: ['insert_count'],
  defaultTitle: 'Insert Performance',
  defaultInterval: 'toStartOfFifteenMinutes',
  defaultLastHours: 24,
  dataTestId: 'insert-performance-chart',
  dateRangeConfig: 'query-activity',
  areaChartProps: {
    readable: 'quantity',
    stack: false,
    showLegend: false,
    showXAxis: true,
    showCartesianGrid: true,
    colors: ['--chart-blue-300'],
    yAxisTickFormatter: chartTickFormatters.count,
  },
})

export default ChartInsertPerformance
