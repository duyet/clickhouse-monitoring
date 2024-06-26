import { RelatedCharts } from '@/components/related-charts'

import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'
import { Suspense } from 'react'

import { databaseDiskSpaceConfig, diskSpaceConfig } from './config'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Disks({ searchParams }: PageProps) {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts relatedCharts={diskSpaceConfig.relatedCharts} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title="Disks"
          config={diskSpaceConfig}
          searchParams={searchParams}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title="Disk usage by databases"
          description="Click on database name to see table level details"
          config={databaseDiskSpaceConfig}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
