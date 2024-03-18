import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { RelatedCharts } from '@/components/related-charts'
import { fetchData } from '@/lib/clickhouse'

import { getQueryConfigByName } from './clickhouse-queries'

interface PageProps {
  params: {
    query: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page({
  params: { query },
  searchParams,
}: PageProps) {
  noStore()

  // Get the query config
  const config = getQueryConfigByName(query)
  if (!config) {
    return notFound()
  }

  // Fetch the data from ClickHouse
  try {
    const queryParams = {
      ...searchParams,
      ...config.defaultParams,
    }
    const data = await fetchData(config.sql, queryParams)

    return (
      <div className="flex flex-col">
        <RelatedCharts relatedCharts={config.relatedCharts} />

        <div>
          <DataTable
            title={query.replaceAll('-', ' ')}
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
