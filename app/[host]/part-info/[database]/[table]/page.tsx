import { Suspense } from 'react'

import {
  levelCountConfig,
  partitionCountConfig,
} from '@/app/[host]/part-info/part-info-configs'
import { TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'

interface PageProps {
  params: Promise<{
    host: string
    database: string
    table: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { host, database, table } = await params
  const searchParamsResolved = await searchParams

  const paramsForTable = {
    hostId: host,
    database,
    table,
    ...searchParamsResolved,
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Suspense fallback={<TableSkeleton />}>
        <Table
          title={`Partition Count`}
          description={`Partition Count for ${database}.${table}`}
          queryConfig={partitionCountConfig}
          searchParams={paramsForTable}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title={`Level Count`}
          description={`Level Count for ${database}.${table}`}
          queryConfig={levelCountConfig}
          searchParams={paramsForTable}
        />
      </Suspense>
    </div>
  )
}
