'use client'

import { createPage } from '@/lib/create-page'
import { replicationQueueConfig } from '@/lib/query-config/tables/replication-queue'

export default createPage({
  queryConfig: replicationQueueConfig,
  title: 'Replication Queue',
})
