'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { CardMultiMetrics } from '@/components/generic-charts/card-multi-metrics'
import { ChartCard } from '@/components/generic-charts/chart-card'
import { useChartData } from '@/lib/swr'

export function ChartSummaryUsedByMutations({
  title,
  className,
  hostId,
}: ChartProps) {
  const { data, isLoading, error, refresh } = useChartData<{
    running_count: number
  }>({
    chartName: 'summary-used-by-mutations',
    hostId,
    refreshInterval: 30000,
  })

  if (isLoading) return <ChartSkeleton title={title} className={className} />
  if (error)
    return <ChartError error={error} title={title} onRetry={refresh} />

  const count = data?.[0] || { running_count: 0 }

  return (
    <ChartCard title={title} className={className} sql="" data={data || []}>
      <div className="flex flex-col content-stretch items-center p-0">
        <CardMultiMetrics
          primary={
            <span className="flex flex-row items-center gap-2 self-center text-center">
              {count.running_count} running mutations
            </span>
          }
          className="p-2"
        />
      </div>
    </ChartCard>
  )
}

export default ChartSummaryUsedByMutations
