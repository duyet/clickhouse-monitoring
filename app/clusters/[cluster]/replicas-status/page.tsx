import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { config, type Row } from './config'

interface PageProps {
  params: {
    cluster: string
  }
}

export default async function Page({ params: { cluster } }: PageProps) {
  const tables = await fetchData<Row[]>({
    query: config.sql,
    query_params: { cluster },
  })

  return (
    <DataTable
      title={`Row counts across '${cluster}' cluster`}
      config={config}
      data={tables}
      topRightToolbarExtras={<TopRightToolbarExtras cluster={cluster} />}
    />
  )
}

const TopRightToolbarExtras = ({ cluster }: PageProps['params']) => (
  <Link href={`/clusters/${cluster}/parts-across-replicas`}>
    <Button
      variant="outline"
      className="flex flex-row gap-2 text-muted-foreground"
    >
      Parts on each tables
    </Button>
  </Link>
)
