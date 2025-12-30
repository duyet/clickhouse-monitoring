/**
 * Page-Level Skeleton Components
 *
 * Provides full-page loading states for better perceived performance during navigation.
 * These skeletons represent the structure of pages before content loads.
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { memo } from 'react'

/**
 * Page Skeleton - Default layout with charts and table
 *
 * Represents a page with a chart grid and data table below.
 * Used by most pages in the application.
 */
export const PageSkeleton = memo(function PageSkeleton({
  chartCount = 4,
  tableRows = 5,
  className,
}: {
  /** Number of chart skeletons to show */
  chartCount?: number
  /** Number of table rows to show */
  tableRows?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: chartCount }).map((_, i) => (
          <ChartCardSkeleton key={`chart-${i}`} />
        ))}
      </div>

      {/* Table Skeleton */}
      <TableCardSkeleton rows={tableRows} />
    </div>
  )
})

/**
 * Charts Only Page Skeleton
 *
 * For pages that only display charts (no table).
 */
export const ChartsOnlyPageSkeleton = memo(function ChartsOnlyPageSkeleton({
  chartCount = 6,
  className,
}: {
  chartCount?: number
  className?: string
}) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-5 md:grid-cols-2', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading charts"
    >
      {Array.from({ length: chartCount }).map((_, i) => (
        <ChartCardSkeleton key={`chart-${i}`} />
      ))}
    </div>
  )
})

/**
 * Table Only Page Skeleton
 *
 * For pages that only display a table (no charts).
 */
export const TableOnlyPageSkeleton = memo(function TableOnlyPageSkeleton({
  rows = 10,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading table"
    >
      <TableCardSkeleton rows={rows} />
    </div>
  )
})

/**
 * Overview Page Skeleton
 *
 * Specialized skeleton for the overview page with tabs.
 */
export const OverviewPageSkeleton = memo(function OverviewPageSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading overview"
    >
      {/* Overview Charts Skeleton (4 cards) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={`metric-${i}`} />
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-3">
        <div className="flex h-10 w-64 gap-2 rounded-lg bg-muted p-1">
          <Skeleton className="h-full flex-1 rounded-md" />
          <Skeleton className="h-full flex-1 rounded-md" />
          <Skeleton className="h-full flex-1 rounded-md" />
          <Skeleton className="h-full flex-1 rounded-md" />
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ChartCardSkeleton key={`tab-chart-${i}`} compact />
          ))}
        </div>
      </div>
    </div>
  )
})

/**
 * Database Page Skeleton
 *
 * For the database explorer page with tree/table structure.
 */
export const DatabasePageSkeleton = memo(function DatabasePageSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search/Filter Bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Database Table */}
      <TableCardSkeleton rows={10} />
    </div>
  )
})

/**
 * Chart Card Skeleton
 *
 * Represents a single chart component card.
 */
export const ChartCardSkeleton = memo(function ChartCardSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const height = compact ? 'h-44' : 'h-56'

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-card/50 p-4',
        'shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
        'flex flex-col gap-3',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-12" />
      </div>

      {/* Chart Area */}
      <Skeleton className={cn('w-full flex-1 rounded-md', height)} />

      {/* Footer/Stats */}
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
})

/**
 * Metric Card Skeleton
 *
 * Small metric card used in overview page.
 */
export const MetricCardSkeleton = memo(function MetricCardSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-card/50 p-4',
        'shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
        'flex flex-col gap-2',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading metric"
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2.5 w-12" />
    </div>
  )
})

/**
 * Table Card Skeleton
 *
 * Represents a data table with header and rows.
 */
export const TableCardSkeleton = memo(function TableCardSkeleton({
  rows = 5,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/50 bg-card/50 overflow-hidden',
        'shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading table data"
    >
      {/* Table Header */}
      <div className="border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`row-${i}`}
            className="flex items-center px-4 py-2.5 sm:px-6 sm:py-3"
          >
            <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
              <Skeleton className="h-4 w-20 sm:w-24" />
              <Skeleton className="hidden h-4 w-28 sm:block" />
              <Skeleton className="hidden h-4 w-32 md:block" />
              <Skeleton className="hidden h-4 w-20 lg:block" />
            </div>
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
})
