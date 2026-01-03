'use client'

import { useSearchParams } from 'next/navigation'
import { TableClient } from '@/components/tables/table-client'
import { queryDetailConfig } from '@/lib/query-config/queries/query-detail'

export function QueryDetailContent() {
  const searchParams = useSearchParams()
  const query_id = searchParams.get('query_id')

  if (!query_id) {
    return (
      <div className="flex h-96 items-center justify-center">
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
