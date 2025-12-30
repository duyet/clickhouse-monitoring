'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { viewRefreshesConfig } from '@/lib/query-config/tables/view-refreshes'

export default function ViewRefreshesPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="View Refreshes"
          description={viewRefreshesConfig.description}
          queryConfig={viewRefreshesConfig}
        />
      </Suspense>
    </div>
  )
}
