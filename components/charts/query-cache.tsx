'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/cards/card-metric'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartQueryCache = memo(function ChartQueryCache({
  title = 'Query Cache',
  className,
  hostId,
}: ChartProps & { name?: string }) {
  const swr = useChartData<{
    total_result_size: number
    total_staled_result_size: number
    readable_total_result_size: string
    readable_total_staled_result_size: string
  }>({
    chartName: 'query-cache',
    hostId,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => {
        const first = dataArray[0] as {
          total_result_size: number
          total_staled_result_size: number
          readable_total_result_size: string
          readable_total_staled_result_size: string
        }

        return (
          <ChartCard title={title} className={className} sql={sql} data={dataArray}>
            <CardMetric
              current={first.total_result_size}
              currentReadable={`${first.readable_total_result_size} cached`}
              target={first.total_staled_result_size}
              targetReadable={`${first.readable_total_staled_result_size} staled`}
              className="p-2"
            />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})
