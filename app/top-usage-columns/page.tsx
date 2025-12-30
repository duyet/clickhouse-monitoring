'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { topUsageColumnsConfig } from '@/lib/query-config/more/top-usage-columns'

export default function TopUsageColumnsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Top Usage Columns"
          description={topUsageColumnsConfig.description}
          queryConfig={topUsageColumnsConfig}
        />
      </Suspense>
    </div>
  )
}
