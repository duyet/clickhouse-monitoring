import { MultiLineSkeleton, SingleLineSkeleton } from '@/components/skeleton'
import type { QueryConfig } from '@/types/query-config'
import { Suspense } from 'react'
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

          <Suspense
            fallback={
              <SingleLineSkeleton className="ml-2 w-40 gap-1 space-x-0 pt-0" />
            }
          >
            <QueryDetailBadge
              queryConfig={queryConfig}
              params={params}
              searchParams={searchParams}
            />
          </Suspense>
        </h3>

        <Suspense
          fallback={
            <SingleLineSkeleton className="w-32 gap-1 space-x-0 pt-0" />
          }
        >
          <DropdownCluster
            params={params}
            searchParams={searchParams}
            className="flex items-center gap-2"
          />
        </Suspense>
      </div>

      <Suspense fallback={<MultiLineSkeleton className="mb-4 w-4/5" />}>
        <QueryDetailCard
          queryConfig={queryConfig}
          params={params}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  )
}
