/**
 * Page-Level Skeleton Components
 *
 * Simple loading states for pages
 */

import { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Page Skeleton - Charts grid and table
 */
export const PageSkeleton = memo(function PageSkeleton({
  chartCount = 4,
  tableRows = 5,
  className,
}: {
  chartCount?: number
  tableRows?: number
  className?: string
} = {}) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: chartCount }).map((_, i) => (
          <ChartSkeleton key={`chart-${i}`} />
        ))}
      </div>

      {/* Table */}
      <TableSkeleton rows={tableRows} />
    </div>
  )
})

/**
 * Charts Only Page Skeleton
 */
export const ChartsOnlyPageSkeleton = memo(function ChartsOnlyPageSkeleton({
  chartCount = 6,
  className,
}: {
  chartCount?: number
  className?: string
} = {}) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-5 md:grid-cols-2', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading charts"
    >
      {Array.from({ length: chartCount }).map((_, i) => (
        <ChartSkeleton key={`chart-${i}`} />
      ))}
    </div>
  )
})

/**
 * Table Only Page Skeleton
 */
export const TableOnlyPageSkeleton = memo(function TableOnlyPageSkeleton({
  rows = 10,
  className,
}: {
  rows?: number
  className?: string
} = {}) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading table"
    >
      <TableSkeleton rows={rows} />
    </div>
  )
})

/**
 * Chart Skeleton
 */
const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div
      className="rounded-lg border border-border/50 bg-card/50 p-4"
      role="status"
      aria-label="Loading chart"
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-36 w-full rounded-md" />
      </div>
    </div>
  )
})

/**
 * Table Skeleton
 */
const TableSkeleton = memo(function TableSkeleton({ rows = 5 }: { rows?: number } = {}) {
  return (
    <div
      className="rounded-lg border border-border/50 bg-card/50 overflow-hidden"
      role="status"
      aria-label="Loading table"
    >
      {/* Header */}
      <div className="border-b border-border/50 p-4">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-3 w-56" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center gap-3 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
})
