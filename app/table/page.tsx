'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import {
  databaseTableColumnsConfig,
  tablesListConfig,
} from '@/lib/query-config/system/database-table'

export default function TablePage() {
  const searchParams = useSearchParams()
  const database = searchParams.get('database') || 'default'
  const table = searchParams.get('table')

  // If only database specified, show tables list
  // If both database and table specified, show table columns
  const queryConfig = table ? databaseTableColumnsConfig : tablesListConfig

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title={table ? `${database}.${table}` : database}
          description={queryConfig.description}
          queryConfig={queryConfig}
          searchParams={{ database, ...(table ? { table } : {}) }}
        />
      </Suspense>
    </div>
  )
}
