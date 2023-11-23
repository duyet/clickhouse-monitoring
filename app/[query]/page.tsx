import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

import { fetchData } from '@/lib/clickhouse'
import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { RelatedCharts } from '@/components/related-charts'

import { getQueryConfigByName } from './clickhouse-queries'

interface PageProps {
  params: {
    query: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page({ params: { query } }: PageProps) {
  noStore()

  // Get the query config
  const config = getQueryConfigByName(query)
  if (!config) {
    return notFound()
  }

  // Fetch the data from ClickHouse
  try {
    const data = await fetchData(config.sql)

    return (
      <div className="flex flex-col">
        <RelatedCharts relatedCharts={config.relatedCharts} />

        <div>
          <DataTable
            title={query.replace('-', ' ')}
            config={config}
            data={data}
          />
        </div>
      </div>
    )
  } catch (error) {
    return <ErrorAlert title="ClickHouse Error" message={`${error}`} />
  }
}
