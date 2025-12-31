'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartSkeletonProps {
  className?: string
  title?: string
}

/**
 * Simple chart skeleton loading state
 */
export const ChartSkeleton = memo(function ChartSkeleton({
  className,
  title,
}: ChartSkeletonProps = {}) {
  return (
    <Card
      className={cn('rounded-md', className)}
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : 'Loading chart'}
    >
      <CardContent className="p-4">
        <div className="flex h-32 flex-col gap-3 sm:h-36">
          {/* Header */}
          <div className="flex justify-between">
            {title ? (
              <span className="text-sm text-muted-foreground">{title}</span>
            ) : (
              <Skeleton className="h-4 w-40" />
            )}
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Chart placeholder */}
          <Skeleton className="flex-1 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
})
