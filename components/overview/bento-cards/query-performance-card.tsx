'use client'

import { ArrowRightIcon } from '@radix-ui/react-icons'

import { SectionHeader } from '../section-header'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatedNumber } from '@/components/cards/metric/animated-number'
import { ChartQueryCount } from '@/components/charts/query/query-count'
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

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header with link */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Query Performance" />
        <Link
          href={buildUrl('/query-history', { host: hostId })}
          className="text-xs text-foreground/50 hover:text-foreground/70 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1 py-0.5"
        >
          Details <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 gap-3">
        {/* Left: Big metric number */}
        <div className="flex w-full flex-col justify-center gap-2 sm:w-1/3">
          {isLoading ? (
            <div className="h-16 rounded bg-foreground/[0.06] [animation:pulse_1.5s_ease-in-out_infinite] motion-reduce:transition-opacity motion-reduce:opacity-50" />
          ) : (
            <>
              <AnimatedNumber
                value={todayCount}
                className="text-3xl font-mono font-semibold tabular-nums text-foreground/90"
              />
              <div className="flex items-center gap-2 text-xs text-foreground/50">
                <span>queries today</span>
                {failureRate > 0 && (
                  <span className="text-rose-500">
                    {failureRate.toFixed(2)}% failed
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Mini chart placeholder */}
        <div className="hidden flex-1 sm:block">
          <ChartQueryCount
            hostId={hostId}
            title=""
            interval="toStartOfHour"
            lastHours={24}
            className="h-full min-h-[100px]"
            chartClassName="h-full"
          />
        </div>
      </div>

      {/* Bottom: Duration metrics */}
      <div className="grid grid-cols-3 gap-2 border-t border-border/50 pt-2">
        {['p50', 'p95', 'p99'].map((percentile) => (
          <div key={percentile} className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-foreground/50">
              {percentile}
            </div>
            <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground/80">
              --
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
