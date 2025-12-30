'use client'

import { PageLayout } from '@/components/page-layout'
import { replicationQueueConfig } from '@/lib/query-config/tables/replication-queue'

export default function ReplicationQueuePage() {
  return (
    <PageLayout
      queryConfig={replicationQueueConfig}
      title="Replication Queue"
    />
  )
}
