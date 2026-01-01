'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { partInfoConfig } from '@/lib/query-config/tables/part-info'

function PartInfoContent() {
  const searchParams = useSearchParams()
  const database = searchParams.get('database')
  const table = searchParams.get('table')

  if (!database || !table) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Database and table parameters are required.
          <br />
          Usage: /part-info?database=default&table=my_table
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title={`Parts: ${database}.${table}`}
          description={partInfoConfig.description}
          queryConfig={partInfoConfig}
          searchParams={{ database, table }}
        />
      </Suspense>
    </div>
  )
}

export default function PartInfoPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PartInfoContent />
    </Suspense>
  )
}
