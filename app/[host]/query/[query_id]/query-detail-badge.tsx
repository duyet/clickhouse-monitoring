import { Badge } from '@/components/ui/badge'
import { fetchData } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'
import { QueryConfig } from '@/types/query-config'
import { type RowData } from './config'
import { PageProps } from './types'

export async function QueryDetailBadge({
  queryConfig,
  params,
}: {
  queryConfig: QueryConfig
  params: Awaited<PageProps['params']>
  searchParams: Awaited<PageProps['searchParams']>
}) {
  try {
    const queryParams = {
      ...queryConfig.defaultParams,
      ...params,
    }
    const { data } = await fetchData<RowData[]>({
      query: queryConfig.sql,
      format: 'JSONEachRow',
      query_params: queryParams,
      clickhouse_settings: {
        use_query_cache: 0,
        ...queryConfig.clickhouseSettings,
      },
      hostId: await getHostIdCookie(),
    })

    if (!data.length) {
      return null
    }

    const { user } = data[0]
    const finalType = data[data.length - 1].type
    const query_duration_ms = data
      .map((row) => parseInt(row.duration_ms))
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
  } catch (error) {
    return null
  }
}
