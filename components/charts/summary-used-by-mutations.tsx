'use client'

import { memo } from 'react'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import type { ChartProps } from '@/components/charts/chart-props'
import { ChartSkeleton } from '@/components/skeletons'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { useChartData } from '@/lib/swr'

export const ChartSummaryUsedByMutations = memo(
  function ChartSummaryUsedByMutations({
    title,
    className,
    hostId,
  }: ChartProps) {
    const { data, isLoading, error, mutate, sql } = useChartData<{
      running_count: number
    }>({
      chartName: 'summary-used-by-mutations',
      hostId,
      refreshInterval: 30000,
    })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) return <ChartSkeleton title={title} className={className} />
    if (error)
      return <ChartError error={error} title={title} onRetry={mutate} />

    // Show empty state if no data
    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    const count = dataArray[0]

    return (
      <ChartCard title={title} className={className} sql={sql} data={dataArray}>
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
)
