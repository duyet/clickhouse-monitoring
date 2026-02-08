'use client'

import { Suspense } from 'react'
import { ExplorerLayout } from '@/components/explorer/explorer-layout'
import { ExplorerSkeleton } from '@/components/skeletons'

export default function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <div className="h-[calc(100vh-4rem)]">
        <ExplorerLayout />
      </div>
    </Suspense>
  )
}
