import type { QueryConfig } from '@/types/query-config'
import { DropdownCluster } from './dropdown-cluster'
import { QueryDetailBadge } from './query-detail-badge'
import { QueryDetailCard } from './query-detail-card'
import type { PageProps } from './types'

export async function QueryDetail({
  queryConfig,
  params,
  searchParams,
}: {
  queryConfig: QueryConfig
  params: Awaited<PageProps['params']>
  searchParams: Awaited<PageProps['searchParams']>
}) {
  const { query_id } = params

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h3 className="flex items-center text-lg font-medium">
          {query_id}

          <QueryDetailBadge
            queryConfig={queryConfig}
            params={params}
            searchParams={searchParams}
          />
        </h3>

        <DropdownCluster
          params={params}
          searchParams={searchParams}
          className="flex items-center gap-2"
        />
      </div>

      <QueryDetailCard
        queryConfig={queryConfig}
        params={params}
        searchParams={searchParams}
      />
    </div>
  )
}
