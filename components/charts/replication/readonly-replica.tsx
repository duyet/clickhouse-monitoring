'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartReadonlyReplica = createBarChart({
  chartName: 'readonly-replica',
  index: 'event_time',
  categories: ['ReadonlyReplica'],
  defaultTitle: 'Readonly Replicated Tables',
  defaultInterval: 'toStartOfHour',
  defaultLastHours: 24,
  dataTestId: 'readonly-replica-chart',
  dateRangeConfig: 'realtime',
  xAxisDateFormat: true,
})

export type ChartReadonlyReplicaProps = ChartProps

export default ChartReadonlyReplica
