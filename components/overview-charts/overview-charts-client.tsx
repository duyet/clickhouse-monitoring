'use client'

import { ClickHouseInfoCard } from './clickhouse-info-card'
import { DatabaseTableCountCard } from './database-table-count-card'
import { DiskSizeCard } from './disk-size-card'
import { RunningQueriesCard } from './running-queries-card'
import { memo } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// OverviewCharts Component
// ============================================================================

/**
 * OverviewCharts - Main grid component for overview metrics
 * Displays 4 cards: Running/Today Queries, Databases/Tables, Disk Usage, Version
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
        'grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4',
        className
      )}
      role="region"
      aria-label="Overview metrics"
    >
      <RunningQueriesCard />
      <DatabaseTableCountCard />
      <DiskSizeCard />
      <ClickHouseInfoCard />
    </div>
  )
})
