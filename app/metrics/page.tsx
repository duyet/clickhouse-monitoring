'use client'

import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { metricsConfig } from '@/lib/query-config/more/metrics'

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="Metrics"
          description={metricsConfig.description}
          queryConfig={metricsConfig}
        />
      </Suspense>
    </div>
  )
}
