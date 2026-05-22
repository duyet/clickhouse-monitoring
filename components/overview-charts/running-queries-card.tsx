'use client'

import { Activity } from 'lucide-react'

import { KpiCard } from './kpi-card'
import { memo } from 'react'
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

export const RunningQueriesCard = memo(function RunningQueriesCard() {
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

  const isLoading = runningSwr.isLoading || todaySwr.isLoading
  const runningCount = runningSwr.data?.[0]?.count ?? 0
  const todayCount = todaySwr.data?.[0]?.count ?? 0

  return (
    <KpiCard
      icon={Activity}
      tone="amber"
      label="Active Queries"
      value={runningCount}
      unit="running"
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
})
