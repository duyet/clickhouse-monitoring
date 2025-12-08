import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse-helpers'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
} from '@/lib/error-utils'

import { queryConfig, type Row } from './config'

interface PageProps {
  params: Promise<{
    host: string
    replica: string
  }>
}

export default async function ClustersPage({ params }: PageProps) {
  const { host, replica } = await params
  const { data, error } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: { replica },
    hostId: host,
  })

  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
        query={queryConfig.sql}
      />
    )
  }

  if (!data) {
    return (
      <ErrorAlert
        title="No Data Available"
        message="No data was returned from the query."
        query={queryConfig.sql}
      />
    )
  }

  return (
    <DataTable
      title={`Tables in replica - ${replica}`}
      queryConfig={queryConfig}
      data={data}
      context={{ replica }}
    />
  )
}
