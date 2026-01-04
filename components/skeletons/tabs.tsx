/**
 * Tabs skeleton component for loading states
 */

import { Skeleton } from './base'
import { cn } from '@/lib/utils'

interface TabsSkeletonProps {
  tabCount?: number
  className?: string
}

export function TabsSkeleton({ tabCount = 5, className }: TabsSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Tabs list skeleton */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
        <div className="bg-muted inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] gap-1">
          {Array.from({ length: tabCount }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-md" />
          ))}
        </div>
      </div>
      {/* Tab content skeleton */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
