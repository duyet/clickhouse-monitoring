'use client'

import { PageLayout } from '@/components/layout/query-page'
import { replicationQueueConfig } from '@/lib/query-config/tables/replication-queue'

export default function ReplicationQueuePage() {
  return (
    <PageLayout
      queryConfig={replicationQueueConfig}
      title="Replication Queue"
    />
  )
}
