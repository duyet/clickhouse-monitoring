'use client'

import type { ChartProps } from '@/components/charts/chart-props'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardMultiMetrics } from '@/components/cards/card-multi-metrics'
import { ChartCard } from '@/components/cards/chart-card'
import { ChartEmpty } from '@/components/charts/chart-empty'
import { ChartError } from '@/components/charts/chart-error'
import { ChartSkeleton } from '@/components/skeletons'
import { useChartData } from '@/lib/swr'

interface MutationMetrics extends ChartDataPoint {
  active: number
  stuck: number
  failed: number
}

const METRIC_CONFIGS = [
  { key: 'active' as const, label: 'active', activeColor: '' },
  {
    key: 'stuck' as const,
    label: 'stuck',
    activeColor: 'text-red-600 dark:text-red-400',
  },
  {
    key: 'failed' as const,
    label: 'failed',
    activeColor: 'text-amber-600 dark:text-amber-400',
  },
] satisfies { key: keyof MutationMetrics; label: string; activeColor: string }[]

export const ChartSummaryStuckMutations = memo(
  function ChartSummaryStuckMutations({
    title,
    className,
    hostId,
  }: ChartProps) {
    const { data, isLoading, error, hasData, staleError, mutate, sql } =
      useChartData<MutationMetrics>({
        chartName: 'summary-stuck-mutations',
        hostId,
        refreshInterval: 30000,
      })

    const dataArray = Array.isArray(data) ? data : undefined

    if (isLoading) return <ChartSkeleton title={title} className={className} />
    if (error && !hasData)
      return <ChartError error={error} title={title} onRetry={mutate} />

    if (!dataArray || dataArray.length === 0) {
      return <ChartEmpty title={title} className={className} />
    }

    const metrics = dataArray[0]

    return (
      <ChartCard
        title={title}
        sql={sql}
        data={dataArray}
        staleError={staleError}
        onRetry={mutate}
      >
        <div className="flex flex-col content-stretch items-center p-0">
          <CardMultiMetrics
            primary={
              <span className="flex flex-row items-center gap-4 self-center text-center">
                {METRIC_CONFIGS.map(({ key, label, activeColor }) => (
                  <span key={key}>
                    <span
                      className={`text-2xl font-bold ${metrics[key] > 0 ? activeColor : ''}`}
                    >
                      {metrics[key]}
                    </span>{' '}
                    <span className="text-muted-foreground text-sm">
                      {label}
                    </span>
                  </span>
                ))}
              </span>
            }
            className="p-2"
          />
        </div>
      </ChartCard>
    )
  }
)
