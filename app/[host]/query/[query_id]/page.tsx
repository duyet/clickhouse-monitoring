import { Suspense } from 'react'

import { RelatedCharts } from '@/components/related-charts'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'
import { config } from './config'
import { QueryDetail } from './query-detail'
import { PageProps } from './types'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function Page({ params, searchParams }: PageProps) {
  const { query_id } = await params
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
        <RelatedCharts relatedCharts={queryConfig.relatedCharts} />
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
