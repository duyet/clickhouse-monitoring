'use client'

import { Activity } from 'lucide-react'

import { KpiCard } from './kpi-card'
import { REFRESH_INTERVAL, useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'

// ============================================================================
// RunningQueriesCard Component
// ============================================================================

/**
 * RunningQueriesCard - "Active Queries" overview KPI.
 * Headline is the live running count; today's total sits in the sub line.
 */

export const RunningQueriesCard = function RunningQueriesCard() {
  const hostId = useHostId()
  const runningSwr = useChartData<{ count: number }>({
    chartName: 'running-queries-count',
    hostId,
    refreshInterval: REFRESH_INTERVAL.FAST_15S,
  })
  const todaySwr = useChartData<{ count: number }>({
    chartName: 'query-count-today',
    hostId,
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  })

  // 24h hourly query volume — real data feeding the header sparkline.
  const trendSwr = useChartData<{
    event_time: string
    query_count: number
    [key: string]: unknown
  }>({
    chartName: 'query-count',
    hostId,
    interval: 'toStartOfHour',
    lastHours: 24,
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  })

  const isLoading = runningSwr.isLoading || todaySwr.isLoading
  const runningCount = runningSwr.data?.[0]?.count ?? 0
  const todayCount = todaySwr.data?.[0]?.count ?? 0
  const spark = (trendSwr.data ?? []).map((d) => Number(d.query_count) || 0)

  return (
    <KpiCard
      icon={Activity}
      tone="amber"
      label="Active Queries"
      value={runningCount}
      unit="running"
      spark={spark.length >= 2 ? spark : undefined}
      sparkColor="hsl(38 92% 55%)"
      sub={
        <>
          <span className="font-medium tabular-nums text-foreground/80">
            {todayCount.toLocaleString()}
          </span>{' '}
          queries today
        </>
      }
      href={buildUrl('/running-queries', { host: hostId })}
      isLoading={isLoading}
    />
  )
}
