'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { queryDetailConfig } from '@/lib/query-config/queries/query-detail'

function QueryDetailContent() {
  const searchParams = useSearchParams()
  const query_id = searchParams.get('query_id')

  if (!query_id) {
    return (
      <div className="flex min-h-[50vh] sm:h-96 items-center justify-center">
        <p className="text-muted-foreground text-sm">Query ID is required</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <TableClient
        title="Query Detail"
        description={queryDetailConfig.description}
        queryConfig={queryDetailConfig}
        searchParams={{ query_id }}
      />
    </div>
  )
}

export default function QueryDetailPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <QueryDetailContent />
    </Suspense>
  )
}
