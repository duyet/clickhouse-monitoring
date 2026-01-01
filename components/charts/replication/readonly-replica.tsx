'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { createBarChart } from '@/components/charts/factory'

export const ChartReadonlyReplica = createBarChart<{
  event_time: string
  ReadonlyReplica: number
}>({
  chartName: 'readonly-replica',
  index: 'event_time',
  categories: ['ReadonlyReplica'],
  defaultTitle: 'Readonly Replicated Tables',
  defaultInterval: 'toStartOfFifteenMinutes',
  defaultLastHours: 24,
  dataTestId: 'readonly-replica-chart',
})

export type ChartReadonlyReplicaProps = ChartProps

export default ChartReadonlyReplica
