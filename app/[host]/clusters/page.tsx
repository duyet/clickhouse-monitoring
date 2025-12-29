import { DataTable } from '@/components/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { fetchData } from '@/lib/clickhouse-helpers'
import {
  formatErrorMessage,
  formatErrorTitle,
  getErrorDocumentation,
  getErrorVariant,
} from '@/lib/error-utils'
import { queryConfig, type Row } from './config'

export const dynamic = 'force-dynamic'

export default async function ClustersPage({
  params,
}: {
  params: Promise<{ host: string }>
}) {
  const { host } = await params
  const { data, error } = await fetchData<Row[]>({
    query: queryConfig.sql,
    hostId: host,
  })

  if (error) {
    return (
      <ErrorAlert
        title={formatErrorTitle(error)}
        message={formatErrorMessage(error)}
        docs={getErrorDocumentation(error)}
        query={queryConfig.sql}
        variant={getErrorVariant(error)}
        errorType={error.type}
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
      queryConfig={queryConfig}
      data={data}
      context={{ hostId: `${host}` }}
    />
  )
}
