'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { queryConfig } from '@/lib/api/clusters-api'

export default function ClustersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TableClient
        title={queryConfig.name}
        description={queryConfig.description}
        queryConfig={queryConfig}
      />
    </Suspense>
  )
}
