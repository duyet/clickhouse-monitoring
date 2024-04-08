import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { config, type Row } from './config'

interface PageProps {
  params: {
    replica: string
  }
}

export default async function ClustersPage({ params: { replica } }: PageProps) {
  const tables = await fetchData<Row[]>({
    query: config.sql,
    query_params: { replica },
  })

  return (
    <DataTable
      title={`Tables in replica - ${replica}`}
      config={config}
      data={tables}
    />
  )
}
