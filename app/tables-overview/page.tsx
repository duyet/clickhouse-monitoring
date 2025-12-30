'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { tablesOverviewConfig } from '@/lib/query-config/tables/tables-overview'

export default function TablesOverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Tables Overview"
          description={tablesOverviewConfig.description}
          queryConfig={tablesOverviewConfig}
        />
      </Suspense>
    </div>
  )
}
