'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/cards/card-metric'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartDiskSize = memo(function ChartDiskSize({
  name,
  title,
  className,
  hostId,
}: ChartProps & { name?: string }) {
  const swr = useChartData<{
    name: string
    used_space: number
    readable_used_space: string
    total_space: number
    readable_total_space: string
  }>({
    chartName: 'disk-size',
    hostId,
    params: name ? { name } : undefined,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => {
        const first = dataArray[0] as {
          name: string
          used_space: number
          readable_used_space: string
          total_space: number
          readable_total_space: string
        }

        return (
          <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="disk-size-chart">
            <CardMetric
              current={first.used_space}
              currentReadable={`${first.readable_used_space} used (${first.name})`}
              target={first.total_space}
              targetReadable={`${first.readable_total_space} total`}
              className="p-2"
            />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})

export default ChartDiskSize
