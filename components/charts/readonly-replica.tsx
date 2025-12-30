'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartReadonlyReplica = memo(function ChartReadonlyReplica({
  title = 'Readonly Replicated Tables',
  interval = 'toStartOfFifteenMinutes',
  lastHours = 24,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    ReadonlyReplica: number
  }>({
    chartName: 'readonly-replica',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName="h-52">
      {(dataArray, sql) => (
        <ChartCard title={title} sql={sql} className={className} data={dataArray} data-testid="readonly-replica-chart">
          <BarChart
            data={dataArray}
            index="event_time"
            categories={['ReadonlyReplica']}
            className="h-52"
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartReadonlyReplica
