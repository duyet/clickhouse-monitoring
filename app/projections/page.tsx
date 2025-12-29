'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { projectionsConfig } from '@/lib/query-config/tables/projections'

export default function ProjectionsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Projections"
          description={projectionsConfig.description}
          queryConfig={projectionsConfig}
        />
      </Suspense>
    </div>
  )
}
