import { Suspense } from 'react'

import { RelatedCharts } from '@/components/related-charts'
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton'
import { Table } from '@/components/table'
import { validateIdentifier } from '@/lib/sql-utils'
import { config } from './config'
import { QueryDetail } from './query-detail'
import type { PageProps } from './types'

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
    // Validate cluster name to prevent SQL injection
    try {
      const sanitizedCluster = validateIdentifier(cluster)
      queryConfig.sql = queryConfig.sql.replace(
        'FROM system.query_log',
        `FROM clusterAllReplicas('${sanitizedCluster}', system.query_log)`
      )
    } catch (_error) {
      // If cluster name is invalid, skip cluster modification
      // The query will run without cluster context
    }
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
