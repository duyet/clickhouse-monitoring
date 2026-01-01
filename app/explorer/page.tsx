'use client'

import { Suspense } from 'react'
import { ExplorerLayout } from '@/components/explorer/explorer-layout'
import { Skeleton } from '@/components/ui/skeleton'

function ExplorerSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-80 border-r p-4">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <ExplorerLayout />
    </Suspense>
  )
}
