'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'

import { SectionHeader } from '../section-header'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { Sparkline } from '@/components/charts/sparkline'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'

/**
 * QueryPerformanceCard - Wide bento card showing query performance metrics
 * Displays query count with sparkline and duration percentiles
 */
export const QueryPerformanceCard = memo(function QueryPerformanceCard() {
  const hostId = useHostId()

  // Fetch today's query count for the big number
  const todaySwr = useChartData<{ count: number }>({
    chartName: 'query-count-today',
    hostId,
    refreshInterval: 120000,
  })

  // Fetch time series data for the sparkline (last 24 hours by hour)
  const sparklineSwr = useChartData<{
    event_time: string
    query_count: number
  }>({
    chartName: 'query-count',
    hostId,
    refreshInterval: 120000,
    lastHours: 24,
    interval: 'toStartOfHour',
  })

  // Fetch failed query count
  const failedSwr = useChartData<{ count: number }>({
    chartName: 'failed-query-count',
    hostId,
    refreshInterval: 120000,
    lastHours: 24,
    interval: 'toStartOfHour',
  })

  const todayCount = todaySwr.data?.[0]?.count ?? 0
  const failedCount = failedSwr.data?.reduce(
    (sum, row) => sum + (row.count ?? 0),
    0
  )
  const failureRate = todayCount > 0 ? (failedCount / todayCount) * 100 : 0

  const isLoading = todaySwr.isLoading || failedSwr.isLoading

  // Convert time series data to sparkline format (array of numbers)
  const sparklineData = sparklineSwr.data?.map((d) => d.query_count) ?? []

  return (
    <div className="flex h-full flex-col gap-2 sm:gap-2.5 md:gap-3">
      {/* Header with link */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Query Performance" />
        <Link
          href={buildUrl('/query-history', { host: hostId })}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-2 py-1"
        >
          Details <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 gap-2 sm:gap-3 md:gap-4">
        {/* Left: Big metric number */}
        <div className="flex flex-col justify-center gap-1.5 sm:gap-2">
          {isLoading ? (
            <div className="h-10 sm:h-12 w-20 sm:w-28 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
          ) : (
            <AnimatedNumber
              value={todayCount}
              className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold tabular-nums text-foreground"
            />
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>queries today</span>
            {failureRate > 0 && (
              <span className="text-rose-500 dark:text-rose-400">
                {failureRate.toFixed(2)}% failed
              </span>
            )}
          </div>
        </div>

        {/* Right: Sparkline chart */}
        <div className="flex-1 flex items-center justify-center min-h-16 sm:min-h-20">
          {isLoading ? (
            <div className="h-full w-full rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
          ) : sparklineData.length > 0 ? (
            <div className="w-full h-16 sm:h-20">
              <Sparkline
                data={sparklineData}
                type="area"
                smooth
                showExtremes={false}
                color="rgb(6 182 212)"
                fillColor="rgb(6 182 212)"
                width={200}
                height={80}
                strokeWidth={2}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom: Duration metrics */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:gap-3 border-t border-border/40 pt-2 sm:pt-2.5 md:pt-3">
        {['p50', 'p95', 'p99'].map((percentile) => (
          <div key={percentile} className="text-center">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.1em] text-muted-foreground">
              {percentile}
            </div>
            <div className="mt-1 font-mono text-base sm:text-lg font-semibold tabular-nums text-foreground">
              --
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
