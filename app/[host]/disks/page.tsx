import { RelatedCharts } from '@/components/related-charts'

import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'
import { Suspense } from 'react'

import { databaseDiskSpaceConfig, diskSpaceConfig } from './config'

export const dynamic = 'force-dynamic'
export const revalidate = 30

interface PageProps {
  params: Promise<{
    host: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Disks({ params, searchParams }: PageProps) {
  const { host } = await params
  const hostId = Number(host)
  const search = await searchParams

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts
          relatedCharts={diskSpaceConfig.relatedCharts}
          hostId={hostId}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title="Disks"
          queryConfig={diskSpaceConfig}
          searchParams={search}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title="Disk usage by databases"
          description="Click on database name to see table level details"
          queryConfig={databaseDiskSpaceConfig}
          searchParams={search}
        />
      </Suspense>
    </div>
  )
}
