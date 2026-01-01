'use client'

import { SplitCard } from './split-card'
import { memo } from 'react'
import { useHostId } from '@/lib/swr'
import { useChartData } from '@/lib/swr/use-chart-data'
import { buildUrl } from '@/lib/url/url-builder'

// ============================================================================
// DatabaseTableCountCard Component
// ============================================================================

/**
 * DatabaseTableCountCard - Displays database and table counts
 * Shows a split view with animated numbers for both metrics
 */

export const DatabaseTableCountCard = memo(function DatabaseTableCountCard() {
  const hostId = useHostId()
  const databaseSwr = useChartData<{ count: number }>({
    chartName: 'database-count',
    hostId,
    refreshInterval: 30000,
  })
  const tablesSwr = useChartData<{ count: number }>({
    chartName: 'table-count',
    hostId,
    refreshInterval: 30000,
  })

  const dbCount = databaseSwr.data?.[0]?.count ?? 0
  const tableCount = tablesSwr.data?.[0]?.count ?? 0

  return (
    <SplitCard
      value1={dbCount}
      label1="Databases"
      value2={tableCount}
      label2="Tables"
      href1={buildUrl('/tables-overview', { host: hostId })}
      href2={buildUrl('/tables-overview', { host: hostId })}
    />
  )
})
