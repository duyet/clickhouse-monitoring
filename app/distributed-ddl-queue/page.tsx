'use client'

import { createPage } from '@/lib/create-page'
import { distributedDdlQueueConfig } from '@/lib/query-config/tables/distributed-ddl-queue'

export default createPage({
  queryConfig: distributedDdlQueueConfig,
  title: 'Distributed DDL Queue',
})
