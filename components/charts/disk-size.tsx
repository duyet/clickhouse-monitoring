'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { CardMetric } from '@/components/generic-charts/card-metric'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartDiskSize({
  name,
  title,
  className,
  hostId,
}: ChartProps & { name?: string }) {
  const { data, isLoading, error, refresh, sql } = useChartData<{
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

  const dataArray = Array.isArray(data) ? data : undefined

  if (isLoading) return <ChartSkeleton title={title} className={className} />
  if (error) return <ChartError error={error} title={title} onRetry={refresh} />

  // Show empty state if no data
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  const first = dataArray[0]

  return (
    <ChartCard title={title} className={className} sql={sql} data={dataArray}>
      <CardMetric
        current={first.used_space}
        currentReadable={`${first.readable_used_space} used (${first.name})`}
        target={first.total_space}
        targetReadable={`${first.readable_total_space} total`}
        className="p-2"
      />
    </ChartCard>
  )
}

export default ChartDiskSize
