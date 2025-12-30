'use client'

import { memo } from 'react'
import { ChartContainer } from '@/components/charts/chart-container'
import type { ChartProps } from '@/components/charts/chart-props'
import { CardMetric } from '@/components/cards/card-metric'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartBackupSize = memo(function ChartBackupSize({
  title,
  lastHours,
  className,
  hostId,
}: ChartProps) {
  const swr = useChartData<{
    total_size: number
    uncompressed_size: number
    compressed_size: number
    readable_total_size: string
    readable_uncompressed_size: string
    readable_compressed_size: string
  }>({
    chartName: 'backup-size',
    hostId,
    lastHours,
    refreshInterval: 30000,
  })

  return (
    <ChartContainer swr={swr} title={title} className={className}>
      {(dataArray, sql) => {
        const first = dataArray[0] as {
          total_size: number
          uncompressed_size: number
          compressed_size: number
          readable_total_size: string
          readable_uncompressed_size: string
          readable_compressed_size: string
        }

        return (
          <ChartCard title={title} className={className} sql={sql} data={dataArray} data-testid="backup-size-chart">
            <CardMetric
              current={first.compressed_size}
              currentReadable={`${first.readable_compressed_size} compressed`}
              target={first.uncompressed_size}
              targetReadable={`${first.readable_uncompressed_size} uncompressed`}
              className="p-2"
            />
          </ChartCard>
        )
      }}
    </ChartContainer>
  )
})
