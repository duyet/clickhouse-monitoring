'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { CardMetric } from '@/components/generic-charts/card-metric'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartBackupSize({
  title,
  lastHours,
  className,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
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

  if (isLoading) return <ChartSkeleton title={title} className={className} />
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  // Single-query chart returns array
  const dataArray = Array.isArray(data) ? data : undefined

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  const first = dataArray[0]

  return (
    <ChartCard title={title} className={className} sql={sql} data={dataArray}>
      <CardMetric
        current={first.compressed_size}
        currentReadable={`${first.readable_compressed_size} compressed`}
        target={first.uncompressed_size}
        targetReadable={`${first.readable_uncompressed_size} uncompressed`}
        className="p-2"
      />
    </ChartCard>
  )
}

export default ChartBackupSize
