'use client'

import { SplitCard } from './split-card'
import { memo } from 'react'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'

// ============================================================================
// RunningQueriesCard Component
// ============================================================================

/**
 * RunningQueriesCard - Displays running query count and today's total queries
 * Shows a split view with animated numbers for both metrics
 */

export const RunningQueriesCard = memo(function RunningQueriesCard() {
  const hostId = useHostId()
  const runningSwr = useChartData<{ count: number }>({
    chartName: 'running-queries-count',
    hostId,
    refreshInterval: 30000,
  })
  const todaySwr = useChartData<{ count: number }>({
    chartName: 'query-count-today',
    hostId,
    refreshInterval: 30000,
  })

  const runningCount = runningSwr.data?.[0]?.count ?? 0
  const todayCount = todaySwr.data?.[0]?.count ?? 0

  return (
    <SplitCard
      value1={runningCount}
      label1={runningCount === 1 ? 'Running Query' : 'Running Queries'}
      value2={todayCount}
      label2="Today"
      href1={buildUrl('/running-queries', { host: hostId })}
      href2={buildUrl('/query-history', { host: hostId })}
    />
  )
})
