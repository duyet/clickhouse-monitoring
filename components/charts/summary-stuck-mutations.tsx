'use client'

import type { ChartProps } from '@/components/charts/chart-props'

import { memo } from 'react'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/skeletons'
import { useChartData } from '@/lib/swr'

export const ChartSummaryStuckMutations = memo(
  function ChartSummaryStuckMutations({
    title,
    className,
    hostId,
  }: ChartProps) {
    const { data, isLoading, error, mutate, sql } = useChartData<{
      active: number
      stuck: number
      failed: number
    }>({
      chartName: 'summary-stuck-mutations',
      hostId,
      refreshInterval: 30000,
    })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) return <ChartSkeleton title={title} className={className} />
    if (error)
      return <ChartError error={error} title={title} onRetry={mutate} />

    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    const { active, stuck, failed } = dataArray[0]

    return (
      <ChartCard title={title} sql={sql} data={dataArray}>
        <div className="flex flex-col content-stretch items-center p-0">
          <CardMultiMetrics
            primary={
              <span className="flex flex-row items-center gap-4 self-center text-center">
                <span>
                  <span className="text-2xl font-bold">{active}</span>{' '}
                  <span className="text-muted-foreground text-sm">active</span>
                </span>
                <span>
                  <span
                    className={`text-2xl font-bold ${stuck > 0 ? 'text-red-600 dark:text-red-400' : ''}`}
                  >
                    {stuck}
                  </span>{' '}
                  <span className="text-muted-foreground text-sm">stuck</span>
                </span>
                <span>
                  <span
                    className={`text-2xl font-bold ${failed > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}
                  >
                    {failed}
                  </span>{' '}
                  <span className="text-muted-foreground text-sm">failed</span>
                </span>
              </span>
            }
            className="p-2"
          />
        </div>
      </ChartCard>
    )
  }
)
