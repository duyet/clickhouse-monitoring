'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartMergeAvgDuration = memo(function ChartMergeAvgDuration({
  title,
  interval = 'toStartOfDay',
  lastHours = 24 * 14,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    avg_duration_ms: number
    readable_avg_duration_ms: string
    bar: number
  }>({
    chartName: 'merge-avg-duration',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="merge-avg-duration-chart">
          <BarChart
            data={dataArray}
            index="event_time"
            categories={['avg_duration_ms']}
            readableColumn="readable_avg_duration_ms"
            className={chartClassName}
            showLabel={false}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartMergeAvgDuration
