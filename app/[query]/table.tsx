import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse'
import type { RowData } from '@tanstack/react-table'

import type { QueryConfig } from '@/lib/types/query-config'

interface TableProps {
  title: string
  config: QueryConfig
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Table({
  title,
  config,
  searchParams,
}: TableProps) {
  // Filters valid query parameters from the URL.
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

  // Retrieve data from ClickHouse.
  try {
    const queryParams = {
      ...config.defaultParams,
      ...validQueryParamsObj,
    }
    const { data, metadata } = await fetchData<RowData[]>({
      query: sql,
      format: 'JSONEachRow',
      query_params: queryParams,
      clickhouse_settings: {
        // The main data table takes longer to load.
        max_execution_time: 300,
        ...config.clickhouseSettings,
      },
    })

    const footerText = `${metadata.rows} row(s) in ${metadata.duration} seconds.`

    return (
      <DataTable
        title={title}
        config={config}
        data={data}
        footer={footerText}
      />
    )
  } catch (error) {
    return <ErrorAlert title="ClickHouse Error" message={`${error}`} />
  }
}
