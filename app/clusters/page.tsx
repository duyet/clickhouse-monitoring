import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { config, type Row } from './config'

export default async function ClustersPage() {
  const tables = await fetchData<Row[]>({ query: config.sql })

  return <DataTable config={config} data={tables} />
}
