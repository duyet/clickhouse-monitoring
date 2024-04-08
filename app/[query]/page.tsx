import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'

import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { RelatedCharts } from '@/components/related-charts'
import { fetchData } from '@/lib/clickhouse'
import type { RowData } from '@tanstack/react-table'

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

  // Get valid query params from URL (existing on QueryConfig['defaultParams'])
  const validQueryParams = Object.entries(searchParams).filter(([key, _]) => {
    return config.defaultParams && config.defaultParams[key] !== undefined
  })
  const validQueryParamsObj = Object.fromEntries(validQueryParams)

  // Filter presets
  let condition = []
  const searchParamsKeys = ('' + searchParams['__presets'])
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key !== '')
  for (const key of searchParamsKeys) {
    const preset = config.filterParamPresets?.find(
      (preset) => preset.key === key
    )
    if (preset) {
      condition.push(preset.sql)
    }
  }

  let sql = config.sql
  if (condition.length > 0) {
    // Adding condition to the query after WHERE (if WHERE exists)
    // or after FROM (if WHERE doesn't exist)
    const whereIndex = sql.indexOf('WHERE')
    const fromIndex = sql.indexOf('FROM')
    const index = whereIndex !== -1 ? whereIndex : fromIndex
    sql =
      sql.slice(0, index) +
      ' WHERE ' +
      condition.join(' AND ') +
      ' AND ' +
      sql.slice(index)
  }

  console.log('========', sql)

  // Fetch the data from ClickHouse
  try {
    const queryParams = {
      ...config.defaultParams,
      ...validQueryParamsObj,
    }
    const data = await fetchData<RowData[]>({
      query: sql,
      format: 'JSONEachRow',
      query_params: queryParams,
    })

    return (
      <div className="flex flex-col">
        <RelatedCharts relatedCharts={config.relatedCharts} />

        <DataTable
          title={query.replaceAll('-', ' ')}
          config={config}
          data={data}
        />
      </div>
    )
  } catch (error) {
    return <ErrorAlert title="ClickHouse Error" message={`${error}`} />
  }
}
