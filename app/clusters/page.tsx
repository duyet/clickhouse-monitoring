import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { config } from './config'

export default async function ClustersPage() {
  const tables = await fetchData(config.sql)

  return <DataTable config={config} data={tables} />
}
