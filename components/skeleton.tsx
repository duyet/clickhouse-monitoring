import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { memo } from 'react'

/**
 * Chart skeleton with shimmer animation
 * Uses theme-aware colors for dark mode support
 */
export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div
      className="mb-5 flex flex-col gap-4"
      role="status"
      aria-label="Loading chart"
      aria-busy="true"
    >
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-12 animate-shimmer rounded-md bg-muted" />
        <Skeleton className="h-12 animate-shimmer rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-16 animate-shimmer bg-muted" />
        <Skeleton className="h-4 w-16 animate-shimmer bg-muted" />
      </div>
      <span className="sr-only">Loading chart data...</span>
    </div>
  )
})

/**
 * Table skeleton with configurable rows and columns
 */
export const TableSkeleton = memo(function TableSkeleton({
  rows = 3,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      className={cn('mb-5 flex w-fit flex-col gap-3', className)}
      role="status"
      aria-label="Loading table"
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="flex flex-row items-center gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={`col-${j}`} className="h-6 w-[200px] animate-shimmer bg-muted" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  )
})

/**
 * Single line skeleton for inline loading states
 */
export const SingleLineSkeleton = memo(function SingleLineSkeleton({
  className = 'w-[500px]',
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-row items-center gap-2 space-x-4 pt-5',
        className
      )}
      role="status"
      aria-busy="true"
    >
      <Skeleton className="h-6 w-3/5 animate-shimmer bg-muted" />
      <Skeleton className="h-6 w-2/5 animate-shimmer bg-muted" />
      <span className="sr-only">Loading...</span>
    </div>
  )
})

/**
 * Multi-line skeleton for larger content areas
 */
export const MultiLineSkeleton = memo(function MultiLineSkeleton({
  className = 'w-[500px]',
}: {
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      role="status"
      aria-busy="true"
    >
      <div className="flex w-full flex-row items-center gap-2">
        <Skeleton className="h-6 w-3/5 animate-shimmer bg-muted" />
        <Skeleton className="h-6 w-2/5 animate-shimmer bg-muted" />
      </div>
      <div className="flex w-full flex-row items-center gap-2">
        <Skeleton className="h-6 w-2/5 animate-shimmer bg-muted" />
        <Skeleton className="h-6 w-2/5 animate-shimmer bg-muted" />
        <Skeleton className="h-6 w-1/5 animate-shimmer bg-muted" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
})

/**
 * List skeleton for loading list items
 */
export const ListSkeleton = memo(function ListSkeleton({
  nrows = 4,
  className = 'w-[500px]',
}: {
  nrows?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col items-center gap-2', className)}
      role="status"
      aria-label="Loading list"
      aria-busy="true"
    >
      {Array.from({ length: nrows }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full animate-shimmer bg-muted" />
      ))}
      <span className="sr-only">Loading list items...</span>
    </div>
  )
})
