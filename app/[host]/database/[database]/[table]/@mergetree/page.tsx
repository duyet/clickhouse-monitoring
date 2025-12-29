import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'
import { Extras } from '../extras/extras'

import { fetchData } from '@/lib/clickhouse-helpers'
import { queryConfig, type Row } from '../config'
import { engineType } from '../engine-type'
import { TableComment } from './table-comment'

interface Props {
  params: Promise<{
    host: string
    database: string
    table: string
  }>
}

export default async function MergeTree({ params }: Props) {
  const { host, database, table } = await params
  const hostId = Number(host)

  const engine = await engineType(database, table)
  if (engine.includes('MergeTree') === false) return <></>

  const { data: columns, error } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: {
      database,
      table,
    },
    hostId: host,
  })

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load table data"
        message={error.message}
        query={queryConfig.sql}
      />
    )
  }

  if (!columns) {
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
      title={`Table: ${database}.${table}`}
      description={<TableComment database={database} table={table} />}
      toolbarExtras={
        <Extras hostId={hostId} database={database} table={table} />
      }
      queryConfig={queryConfig}
      data={columns}
      context={{ host: `${host}`, database, table }}
    />
  )
}
