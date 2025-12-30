'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { expensiveQueriesByMemoryConfig } from '@/lib/query-config/queries/expensive-queries-by-memory'

export default function ExpensiveQueriesByMemoryPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Most Expensive Queries by Memory"
          description={expensiveQueriesByMemoryConfig.description}
          queryConfig={expensiveQueriesByMemoryConfig}
        />
      </Suspense>
    </div>
  )
}
