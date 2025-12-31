import { Skeleton } from './base'
import { PageSkeleton } from './page'

export function SidebarSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 border-r bg-sidebar p-4 md:block">
        <Skeleton className="mb-4 h-8 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-6">
          <PageSkeleton />
        </div>
      </div>
    </div>
  )
}
