import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse'
import type { RowData } from '@tanstack/react-table'

import type { QueryConfig } from '@/types/query-config'

interface TableProps {
  title: string
  description?: string
  config: QueryConfig
  searchParams: { [key: string]: string | string[] | undefined }
  className?: string
}

export async function Table({
  title,
  description,
  config,
  searchParams,
  className,
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
    // Check if WHERE clause exists
    const whereIndex = sql.toUpperCase().indexOf('WHERE')
    if (whereIndex !== -1) {
      // If WHERE exists, add conditions after it
      sql =
        sql.slice(0, whereIndex + 5) +
        ' ' +
        condition.join(' AND ') +
        ' AND ' +
        sql.slice(whereIndex + 5)
    } else {
      // If WHERE doesn't exist, add it before ORDER BY or at the end
      const orderByIndex = sql.toUpperCase().indexOf('ORDER BY')
      if (orderByIndex !== -1) {
        sql =
          sql.slice(0, orderByIndex) +
          ' WHERE ' +
          condition.join(' AND ') +
          ' ' +
          sql.slice(orderByIndex)
      } else {
        sql += ' WHERE ' + condition.join(' AND ')
      }
    }
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
        description={description}
        config={config}
        data={data}
        footnote={footerText}
        className={className}
      />
    )
  } catch (error) {
    console.error(`<Table /> failed render, error: "${error}"`)
    return (
      <ErrorAlert
        title="ClickHouse Query Error"
        message={`${error}`}
        query={sql}
      />
    )
  }
}
