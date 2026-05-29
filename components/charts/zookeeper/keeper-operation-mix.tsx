'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

/**
 * Keeper operation mix — which request types dominate, from cumulative
 * ZooKeeper* ProfileEvents (system.events). Categorical bar (operation vs count).
 */
export const ChartKeeperOperationMix = createBarChart({
  chartName: 'keeper-operation-mix',
  index: 'operation',
  categories: ['count'],
  defaultTitle: 'Operation Mix',
  dataTestId: 'keeper-operation-mix-chart',
  xAxisDateFormat: false,
  barChartProps: {
    readableColumn: 'readable_count',
    layout: 'vertical',
    showLegend: false,
  },
})

export type ChartKeeperOperationMixProps = ChartProps

export default ChartKeeperOperationMix
