'use client'

import { Badge } from '@/components/ui/badge'
import { SingleLineSkeleton } from '@/components/skeleton'
import { useFetchData } from '@/lib/swr'
import type { QueryConfig } from '@/types/query-config'
import type { RowData } from './config'
import type { PageProps } from './types'

export function QueryDetailBadge({
  queryConfig,
  params,
}: {
  queryConfig: QueryConfig
  params: Awaited<PageProps['params']>
  searchParams: Awaited<PageProps['searchParams']>
}) {
  const queryParams = {
    ...queryConfig.defaultParams,
    ...params,
  }

  const { data, isLoading, error } = useFetchData<RowData[]>(
    queryConfig.sql,
    queryParams,
    undefined, // hostId will be read from SWR context
    10000 // refresh every 10 seconds for live query data
  )

  if (isLoading) {
    return <SingleLineSkeleton className="ml-2 w-40 gap-1 space-x-0 pt-0" />
  }

  if (error || !data?.length) {
    return null
  }

  const { user } = data[0]
  const finalType = data[data.length - 1].type
  const query_duration_ms = data
    .map((row) => parseInt(row.duration_ms, 10))
    .reduce((a, b) => a + b, 0)

  return (
    <>
      <Badge className="ml-2" variant="outline" title="Query Duration (ms)">
        {query_duration_ms} ms
      </Badge>
      <Badge className="ml-2" variant="outline" title="Query Type">
        {finalType || 'Unknown'}
      </Badge>
      <Badge className="ml-2" variant="outline" title="User">
        {user || 'Unknown'}
      </Badge>
    </>
  )
}
