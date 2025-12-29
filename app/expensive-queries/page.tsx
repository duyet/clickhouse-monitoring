'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { expensiveQueriesConfig } from '@/lib/query-config/queries/expensive-queries'

export default function ExpensiveQueriesPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Most Expensive Queries"
          description={expensiveQueriesConfig.description}
          queryConfig={expensiveQueriesConfig}
        />
      </Suspense>
    </div>
  )
}
