import { fetchData } from '@/lib/clickhouse'
import { TabsContent } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table/data-table'

import { config } from './config'

interface PageProps {
  params: {
    cluster: string
  }
}

export default async function ClustersPage({ params: { cluster } }: PageProps) {
  const tables = await fetchData(config.sql, { cluster })

  return (
    <DataTable
      title={`Row counts across '${cluster}' cluster`}
      config={config}
      data={tables}
    />
  )
}
