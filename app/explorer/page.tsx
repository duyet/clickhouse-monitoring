'use client'

import dynamicModule from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-static'

function ExplorerSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r p-4">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}

const ExplorerLayout = dynamicModule(
  () =>
    import('@/components/explorer/explorer-layout').then(
      (m) => m.ExplorerLayout
    ),
  { ssr: false, loading: () => <ExplorerSkeleton /> }
)

export default function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <div className="h-[calc(100vh-4rem)]">
        <ExplorerLayout />
      </div>
    </Suspense>
  )
}
