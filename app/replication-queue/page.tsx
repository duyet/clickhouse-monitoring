'use client'

import { Suspense } from 'react'
import { PageLayout } from '@/components/layout/query-page'
import { replicationQueueConfig } from '@/lib/query-config/tables/replication-queue'
import { ChartSkeleton } from '@/components/skeletons'

function ReplicationQueuePageContent() {
  return (
    <PageLayout
      queryConfig={replicationQueueConfig}
      title="Replication Queue"
    />
  )
}

export default function ReplicationQueuePage() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ReplicationQueuePageContent />
    </Suspense>
  )
}
