import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'

import { Button } from '@/components/ui/button'
import { getScopedLink } from '@/lib/scoped-link'
import Link from 'next/link'
import { queryConfig, type Row } from './config'

interface PageProps {
  params: Promise<{
    cluster: string
  }>
}

export default async function Page({ params }: PageProps) {
  const { cluster } = await params

  const { data } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: { cluster },
  })

  return (
    <DataTable
      title={`Row counts across '${cluster}' cluster`}
      queryConfig={queryConfig}
      data={data}
      context={{ cluster }}
      topRightToolbarExtras={<TopRightToolbarExtras cluster={cluster} />}
    />
  )
}

const TopRightToolbarExtras = async ({
  cluster,
}: Awaited<PageProps['params']>) => (
  <div className="flex flex-row gap-2">
    <Link
      href={await getScopedLink(`/clusters/${cluster}/parts-across-replicas`)}
    >
      <Button
        variant="outline"
        className="flex flex-row gap-2 text-muted-foreground"
      >
        Parts on each table
      </Button>
    </Link>
    <Link
      href={await getScopedLink(`/clusters/${cluster}/count-across-replicas`)}
    >
      <Button
        variant="outline"
        className="flex flex-row gap-2 text-muted-foreground"
      >
        Count on each tables
      </Button>
    </Link>
  </div>
)
