'use client'

import { createAreaChart } from '@/components/charts/factory'

export const HumanVsBotPageviewsChart = createAreaChart({
  chartName: 'human-vs-bot-pageviews',
  index: 'event_time',
  categories: ['human_views', 'bot_views'],
  defaultTitle: 'Human vs Bot Pageviews',
  defaultInterval: 'toStartOfDay',
  defaultLastHours: 24 * 30,
  dataTestId: 'human-vs-bot-pageviews-chart',
  dateRangeConfig: 'page-views',
  areaChartProps: {
    stack: true,
    showLegend: true,
    showXAxis: true,
    showYAxis: true,
  },
})
