import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { queryConfig, type Row } from './config'

export const dynamic = 'force-dynamic'

export default async function ClustersPage({
  params,
}: {
  params: Promise<{ host: number }>
}) {
  const { host } = await params
  const { data } = await fetchData<Row[]>({ 
    query: queryConfig.sql,
    hostId: host
  })

  return (
    <DataTable
      queryConfig={queryConfig}
      data={data}
      context={{ hostId: '' + host }}
    />
  )
}
