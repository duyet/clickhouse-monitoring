'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { asynchronousMetricsConfig } from '@/lib/query-config/more/asynchronous-metrics'

export default function AsynchronousMetricsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Asynchronous Metrics"
          description={asynchronousMetricsConfig.description}
          queryConfig={asynchronousMetricsConfig}
        />
      </Suspense>
    </div>
  )
}
