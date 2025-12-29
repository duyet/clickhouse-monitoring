'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { topUsageTablesConfig } from '@/lib/query-config/more/top-usage-tables'

export default function TopUsageTablesPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Top Usage Tables"
          description={topUsageTablesConfig.description}
          queryConfig={topUsageTablesConfig}
        />
      </Suspense>
    </div>
  )
}
