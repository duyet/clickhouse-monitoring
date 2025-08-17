import { DataTable } from '@/components/data-table/data-table'
import { Extras } from '../extras/extras'

import { fetchData } from '@/lib/clickhouse'
import { queryConfig, type Row } from '../config'
import { engineType } from '../engine-type'
import { TableComment } from './table-comment'

interface Props {
  params: Promise<{
    host: number
    database: string
    table: string
  }>
}

export default async function MergeTree({ params }: Props) {
  const { host, database, table } = await params

  const engine = await engineType(database, table)
  if (engine.includes('MergeTree') === false) return <></>

  const { data: columns } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: {
      database,
      table,
    },
    hostId: host,
  })

  return (
    <DataTable
      title={`Table: ${database}.${table}`}
      description={<TableComment database={database} table={table} />}
      toolbarExtras={<Extras host={host} database={database} table={table} />}
      queryConfig={queryConfig}
      data={columns}
      context={{ host: `${host}`, database, table }}
    />
  )
}
