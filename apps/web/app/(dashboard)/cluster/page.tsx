'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useHostId } from '@/lib/swr'

// The topology view hand-builds a large SVG graph; lazy-load it so the page
// shell paints immediately and the canvas code is split into its own chunk.
const TopologyView = dynamic(
  () => import('@/components/cluster-topology').then((m) => m.TopologyView),
  {
    ssr: false,
    loading: () => <PageSkeleton />,
  }
)

function PageSkeleton() {
  return (
    <div className="max-w-[1640px]">
      <Skeleton className="mb-4 h-4 w-72" />
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-[540px] w-full rounded-xl" />
        <Skeleton className="h-[540px] w-full rounded-xl" />
      </div>
    </div>
  )
}

function ClusterTopologyContent() {
  const hostId = useHostId()
  return <TopologyView hostId={hostId} />
}

export default function ClusterTopologyPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClusterTopologyContent />
    </Suspense>
  )
}
