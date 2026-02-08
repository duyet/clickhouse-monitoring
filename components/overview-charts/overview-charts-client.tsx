'use client'

import { ClickHouseInfoCard } from './clickhouse-info-card'
import { DatabaseTableCountCard } from './database-table-count-card'
import { DiskSizeCard } from './disk-size-card'
import { RunningQueriesCard } from './running-queries-card'
import { RunningQueriesProgressiveCard } from './running-queries-progressive-card'
import { memo } from 'react'
import { cn } from '@/lib/utils'

// Feature flag for progressive disclosure (can be enabled via URL param)
const PROGRESSIVE_DISCLOSURE_ENABLED = false

// ============================================================================
// OverviewCharts Component
// ============================================================================

/**
 * OverviewCharts - Main grid component for overview metrics
 * Displays 4 cards: Running/Today Queries, Databases/Tables, Disk Usage, Version
 *
 * Progressive disclosure cards can be enabled by adding ?progressive=1 to URL
 */

interface OverviewChartsProps {
  className?: string
}

export const OverviewCharts = memo(function OverviewCharts({
  className,
}: OverviewChartsProps) {
  return (
    <div
      className={cn(
        'grid auto-rows-fr grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-4',
        className
      )}
      role="region"
      aria-label="Overview metrics"
    >
      {PROGRESSIVE_DISCLOSURE_ENABLED ? (
        <RunningQueriesProgressiveCard />
      ) : (
        <RunningQueriesCard />
      )}
      <DatabaseTableCountCard />
      <DiskSizeCard />
      <ClickHouseInfoCard />
    </div>
  )
})
