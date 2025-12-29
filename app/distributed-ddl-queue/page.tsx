'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { distributedDdlQueueConfig } from '@/lib/query-config/tables/distributed-ddl-queue'

export default function DistributedDdlQueuePage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Distributed DDL Queue"
          description={distributedDdlQueueConfig.description}
          queryConfig={distributedDdlQueueConfig}
        />
      </Suspense>
    </div>
  )
}
