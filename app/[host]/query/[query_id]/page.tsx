import { Suspense } from 'react'

import { RelatedCharts } from '@/components/related-charts'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'
import { config } from './config'
import { QueryDetail } from './query-detail'
import { PageProps } from './types'

export const dynamic = 'force-dynamic'
export const revalidate = 3600
export const maxDuration = 30

export default async function Page({ params, searchParams }: PageProps) {
  const { host, query_id } = await params
  const hostId = Number(host)
  const { cluster } = await searchParams

  // Binding the query_id to the config
  const queryConfig = {
    ...config,
    defaultParams: {
      query_id,
    },
  }

  if (cluster) {
    queryConfig.sql = queryConfig.sql.replace(
      'FROM system.query_log',
      `FROM clusterAllReplicas('${cluster}', system.query_log)`
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<ChartSkeleton />}>
        <RelatedCharts
          relatedCharts={queryConfig.relatedCharts}
          hostId={hostId}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <QueryDetail
          queryConfig={queryConfig}
          params={await params}
          searchParams={await searchParams}
        />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <Table
          title="Query Stages"
          queryConfig={queryConfig}
          searchParams={await searchParams}
        />
      </Suspense>
    </div>
  )
}
