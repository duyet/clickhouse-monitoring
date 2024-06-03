import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { config, type Row } from './config'

// Redirects to the first database.
export default async function ClustersPage() {
  const { data } = await fetchData<Row[]>({ query: config.sql })

  return <DataTable config={config} data={data} />
}
