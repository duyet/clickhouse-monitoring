'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { commonErrorsConfig } from '@/lib/query-config/queries/common-errors'

export default function CommonErrorsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Latest Common Errors"
          description={commonErrorsConfig.description}
          queryConfig={commonErrorsConfig}
        />
      </Suspense>
    </div>
  )
}
