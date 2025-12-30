'use client'

import { memo } from 'react'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { AreaChart } from '@/components/charts/primitives/area'
import { useChartData } from '@/lib/swr'
import { chartTickFormatters } from '@/lib/utils'

export const ChartCPUUsage = memo(function ChartCPUUsage({
  title,
  interval = 'toStartOfTenMinutes',
  lastHours = 24,
  className,
  chartClassName,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    event_time: string
    avg_cpu: number
  }>({
    chartName: 'cpu-usage',
    hostId,
    interval,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className} chartClassName={chartClassName}>
      {(dataArray, sql) => (
        <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="cpu-usage-chart">
          <AreaChart
            data={dataArray}
            index="event_time"
            categories={['avg_cpu']}
            className={chartClassName}
            yAxisTickFormatter={chartTickFormatters.duration}
          />
        </ChartCard>
      )}
    </ChartContainer>
  )
})

export default ChartCPUUsage
