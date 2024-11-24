import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { queryConfig, type Row } from './config'

interface PageProps {
  params: Promise<{
    replica: string
  }>
}

export default async function ClustersPage({ params }: PageProps) {
  const { replica } = await params
  const { data } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: { replica },
  })

  return (
    <DataTable
      title={`Tables in replica - ${replica}`}
      queryConfig={queryConfig}
      data={data}
      context={{ replica }}
    />
  )
}
