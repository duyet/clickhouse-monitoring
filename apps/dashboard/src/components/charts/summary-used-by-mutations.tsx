import { Activity } from 'lucide-react'

import type { ChartProps } from '@/components/charts/chart-props'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/skeletons'
import { REFRESH_INTERVAL, useChartData } from '@/lib/swr'

export const ChartSummaryUsedByMutations =
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
      refreshInterval: REFRESH_INTERVAL.MEDIUM_30S,
    })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) return <ChartSkeleton title={title} className={className} />
    if (error)
      return (
        <ChartError
          error={error}
          title={title}
          onRetry={mutate}
          className={className}
        />
      )

    // Show empty state if no data
    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    const count = dataArray[0]
    const isIdle = count.running_count === 0

    return (
      <ChartCard title={title} sql={sql} data={dataArray} className={className}>
        <div className="flex flex-col items-center justify-center gap-2 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums leading-none text-foreground">
              {count.running_count}
            </span>
            <span className="text-sm text-muted-foreground">running</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity
              className={
                isIdle
                  ? 'size-3.5 text-muted-foreground/50'
                  : 'size-3.5 text-emerald-500'
              }
              strokeWidth={1.5}
            />
            <span>
              {isIdle ? 'no active mutations' : 'mutations in progress'}
            </span>
          </div>
        </div>
      </ChartCard>
    )
  }
