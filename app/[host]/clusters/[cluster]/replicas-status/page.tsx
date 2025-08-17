import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { Button } from '@/components/ui/button'
import { getScopedLink } from '@/lib/scoped-link'
import Link from 'next/link'
import { queryConfig, type Row } from './config'

interface PageProps {
  params: Promise<{
    host: number
    cluster: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { host, cluster } = await params

  const { data } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: { cluster },
    hostId: host,
  })

  return (
    <DataTable
      title={`Row counts across '${cluster}' cluster`}
      queryConfig={queryConfig}
      data={data}
      context={{ cluster }}
      topRightToolbarExtras={<TopRightToolbarExtras host={host} cluster={cluster} />}
    />
  )
}

const TopRightToolbarExtras = async ({
  host,
  cluster,
}: Awaited<PageProps['params']>) => (
  <div className="flex flex-row gap-2">
    <Link
      href={await getScopedLink(`/clusters/${cluster}/parts-across-replicas`)}
    >
      <Button
        variant="outline"
        className="text-muted-foreground flex flex-row gap-2"
      >
        Parts on each table
      </Button>
    </Link>
    <Link
      href={await getScopedLink(`/clusters/${cluster}/count-across-replicas`)}
    >
      <Button
        variant="outline"
        className="text-muted-foreground flex flex-row gap-2"
      >
        Count on each tables
      </Button>
    </Link>
  </div>
)
