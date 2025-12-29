'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { detachedPartsConfig } from '@/lib/query-config/tables/detached-parts'

export default function DetachedPartsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Detached Parts"
          description={detachedPartsConfig.description}
          queryConfig={detachedPartsConfig}
        />
      </Suspense>
    </div>
  )
}
