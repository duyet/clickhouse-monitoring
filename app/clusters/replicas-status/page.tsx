'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { clustersReplicasStatusConfig } from '@/lib/query-config/system/replicas-status'
import { useHostId } from '@/lib/swr'

function ReplicasStatusContent() {
  const searchParams = useSearchParams()
  const hostId = useHostId()
  const cluster = searchParams.get('cluster')

  const clustersUrl = `/clusters?host=${hostId}`

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb and cluster info */}
      <div className="bg-card flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Link
            href={clustersUrl}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Clusters
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{cluster || 'Select a cluster'}</span>
        </div>
      </div>

      {/* Table Content */}
      {cluster ? (
        <Suspense fallback={<TableSkeleton />}>
          <TableClient
            title={`Replicas Status: ${cluster}`}
            description={clustersReplicasStatusConfig.description}
            queryConfig={clustersReplicasStatusConfig}
            searchParams={{ cluster }}
          />
        </Suspense>
      ) : (
        <div className="bg-card flex h-96 items-center justify-center rounded-lg border">
          <p className="text-muted-foreground text-sm">
            Select a cluster from the{' '}
            <Link href={clustersUrl} className="text-primary hover:underline">
              clusters list
            </Link>{' '}
            to view replicas status.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ClusterReplicasStatusPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ReplicasStatusContent />
    </Suspense>
  )
}
