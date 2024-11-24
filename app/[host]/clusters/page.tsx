import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { getHostIdCookie } from '@/lib/scoped-link'
import { queryConfig, type Row } from './config'

export const dynamic = 'force-dynamic'

export default async function ClustersPage() {
  const { data } = await fetchData<Row[]>({ query: queryConfig.sql })

  return (
    <DataTable
      queryConfig={queryConfig}
      data={data}
      context={{ hostId: '' + (await getHostIdCookie()) }}
    />
  )
}
