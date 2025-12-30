import type { RowData } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
  getErrorVariant,
} from '@/lib/error-utils'
import { ErrorLogger } from '@/lib/logger'
import { getHostIdCookie } from '@/lib/scoped-link'
import type { QueryConfig } from '@/types/query-config'

interface TableProps {
  title: string
  description?: string
  queryConfig: QueryConfig
  searchParams: { [key: string]: string | string[] | undefined }
  className?: string
}

export async function Table({
  title,
  description,
  queryConfig,
  searchParams,
  className,
}: TableProps) {
  const hostId = await getHostIdCookie()

  // Filters valid query parameters from the URL.
  const validQueryParams = Object.entries(searchParams).filter(([key, _]) => {
    return (
      queryConfig.defaultParams && queryConfig.defaultParams[key] !== undefined
    )
  })
  const validQueryParamsObj = Object.fromEntries(validQueryParams)

  // Retrieve data from ClickHouse.
  const queryParams = {
    ...queryConfig.defaultParams,
    ...validQueryParamsObj,
  }

  const { data, metadata, error } = await fetchData<RowData[]>({
    query: queryConfig.sql,
    format: 'JSONEachRow',
    query_params: queryParams,
    clickhouse_settings: {
      // The main data table takes longer to load.
      max_execution_time: 300,
      ...queryConfig.clickhouseSettings,
    },
    hostId,
    queryConfig,
  })

  if (error) {
    ErrorLogger.logError(new Error(error.message), {
      component: 'Table',
      query: queryConfig.name,
    })
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        query={queryConfig.sql}
        docs={getErrorDocumentation(error) || queryConfig.docs}
        variant={getErrorVariant(error)}
        errorType={error.type}
      />
    )
  }

  // Safety check for null data
  if (!data) {
    ErrorLogger.logWarning('Table received null data without error', {
      component: 'Table',
      query: queryConfig.name,
    })
    return (
      <ErrorAlert
        title="No Data Available"
        message="No data was returned from the query."
        query={queryConfig.sql}
        docs={queryConfig.docs}
      />
    )
  }

  const footerText = `${metadata.rows} row(s) in ${metadata.duration} seconds.`

  return (
    <DataTable
      title={title}
      description={description}
      queryConfig={queryConfig}
      queryParams={queryParams}
      data={data}
      context={{ ...queryParams, hostId: `${hostId}` }}
      footnote={footerText}
      className={className}
    />
  )
}
