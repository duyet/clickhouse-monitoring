import { unstable_noStore as noStore } from 'next/cache'

import { fetchData } from '@/lib/clickhouse'
import { getQueryConfigByName, queries } from '@/lib/clickhouse-queries'
import { DataTable } from '@/components/data-table/data-table'
import { RelatedCharts } from '@/components/related-charts'

interface PageProps {
  params: {
    name: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 5

export default async function Page({ params: { name } }: PageProps) {
  noStore()

  // Get the query config
  const config = getQueryConfigByName(name)
  if (!config) {
    return <div>404</div>
  }

  // Fetch the data from ClickHouse
  const data = await fetchData(config.sql)

  return (
    <div className="flex flex-col">
      <RelatedCharts relatedCharts={config.relatedCharts} />

      <div>
        <DataTable title={name.replace('-', ' ')} config={config} data={data} />
      </div>
    </div>
  )
}

export const generateStaticParams = async () =>
  queries.map(({ name }) => ({
    name,
  }))
