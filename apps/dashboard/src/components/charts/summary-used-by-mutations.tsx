import type { ChartProps } from '@/components/charts/chart-props'

import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
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

    return (
      <ChartCard title={title} sql={sql} data={dataArray} className={className}>
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
