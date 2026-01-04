import { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
