'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { CardMetric } from '@/components/generic-charts/card-metric'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartQueryCache({
  title = 'Query Cache',
  className,
  hostId,
}: ChartProps & { name?: string }) {
  const { data, isLoading, error, refresh } = useChartData<{
    total_result_size: number
    total_staled_result_size: number
    readable_total_result_size: string
    readable_total_staled_result_size: string
  }>({
    chartName: 'query-cache',
    hostId,
    refreshInterval: 30000,
  })

  if (isLoading)
    return <ChartSkeleton title={title} className={className} />
  if (error)
    return <ChartError error={error} title={title} onRetry={refresh} />

  const first = data?.[0]
  if (!data || !first) return null

  return (
    <ChartCard title={title} className={className} sql="" data={data || []}>
      <CardMetric
        current={first.total_result_size}
        currentReadable={`${first.readable_total_result_size} cached`}
        target={first.total_staled_result_size}
        targetReadable={`${first.readable_total_staled_result_size} staled`}
        className="p-2"
      />
    </ChartCard>
  )
}

export default ChartQueryCache
