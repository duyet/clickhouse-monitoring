import { Suspense } from 'react'

import { RelatedCharts } from '@/components/related-charts'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'

import { databaseDiskSpaceByDatabaseConfig as queryConfig } from '../../config'

interface PageProps {
  params: Promise<{
    host: string
    database: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { host, database } = await params
  const hostId = Number(host)
  const _searchParams = await searchParams

  let searchParamsCombine = {
    ..._searchParams,
    database,
  }

  return (
    <div className="flex flex-col">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts
          relatedCharts={queryConfig.relatedCharts}
          hostId={hostId}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title={'Disks usage by database: ' + database}
          queryConfig={queryConfig}
          searchParams={searchParamsCombine}
        />
      </Suspense>
    </div>
  )
}
