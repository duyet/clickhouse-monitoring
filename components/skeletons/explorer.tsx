/**
 * Explorer page skeleton
 *
 * Matches the two-pane layout of the database explorer page.
 */

'use client'

import { memo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const ExplorerSkeleton = memo(function ExplorerSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]" role="status" aria-busy="true">
      {/* Left sidebar - database tree */}
      <div className="w-full sm:w-64 md:w-80 border-r p-2 sm:p-3 md:p-4">
        <div className="space-y-3">
          {/* Search box */}
          <Skeleton className="h-9 w-full" />
          {/* Tree items */}
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - table preview */}
      <div className="flex-1 p-2 sm:p-3 md:p-4">
        <div className="space-y-4">
          {/* Table header */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Table preview */}
          <div className="rounded-md border">
            <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
              >
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Loading database explorer...</span>
    </div>
  )
})
