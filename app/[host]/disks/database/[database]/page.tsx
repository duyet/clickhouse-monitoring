import { Suspense } from 'react'

import { RelatedCharts } from '@/components/related-charts'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'

import { databaseDiskSpaceByDatabaseConfig as queryConfig } from '../../config'

interface PageProps {
  params: Promise<{
    database: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { database } = await params
  const _searchParams = await searchParams

  let searchParamsCombine = {
    ..._searchParams,
    database,
  }

  return (
    <div className="flex flex-col">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts relatedCharts={queryConfig.relatedCharts} />
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
