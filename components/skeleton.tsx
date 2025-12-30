import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { memo } from 'react'

/**
 * Chart skeleton - re-exported from charts/chart-skeleton
 * This provides backward compatibility for imports from @/components/skeleton
 *
 * For advanced usage with SVG variants, import directly from @/components/charts/chart-skeleton
 */
export { ChartSkeleton } from '@/components/charts/chart-skeleton'

/**
 * Table skeleton with configurable rows and columns
 * Matches DataTable layout to prevent CLS
 */
export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      role="status"
      aria-label="Loading table"
      aria-busy="true"
    >
      {/* Table header area - matches DataTable */}
      <div className="flex shrink-0 flex-row items-start justify-between pb-4">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Skeleton className="h-7 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Table body - matches DataTable border container */}
      <div className="mb-5 min-h-0 flex-1 overflow-hidden rounded-md border">
        {/* Table header row */}
        <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={`header-${j}`} className="h-4 flex-1" />
          ))}
        </div>
        {/* Table rows */}
        <div className="flex flex-col">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={`row-${i}`}
              className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              {Array.from({ length: cols }).map((_, j) => (
                <Skeleton key={`col-${j}`} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination footer */}
      <div className="flex shrink-0 items-center justify-between px-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
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
      aria-label="Loading content"
      aria-busy="true"
    >
      <Skeleton className="h-6 w-3/5" />
      <Skeleton className="h-6 w-2/5" />
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
      aria-label="Loading content"
      aria-busy="true"
    >
      <div className="flex w-full flex-row items-center gap-2">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-6 w-2/5" />
      </div>
      <div className="flex w-full flex-row items-center gap-2">
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="h-6 w-1/5" />
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
        <Skeleton key={i} className="h-6 w-full" />
      ))}
      <span className="sr-only">Loading list items...</span>
    </div>
  )
})
