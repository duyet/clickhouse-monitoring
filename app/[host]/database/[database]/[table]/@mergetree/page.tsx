import { DataTable } from '@/components/data-table/data-table'
import { Extras } from '../extras/extras'

import { fetchData } from '@/lib/clickhouse'
import { queryConfig, type Row } from '../config'
import { engineType } from '../engine-type'
import { TableComment } from './table-comment'
import { Toolbar } from './toolbar'

interface Props {
  params: {
    host: number
    database: string
    table: string
  }
}

export default async function MergeTree({
  params: { host, database, table },
}: Props) {
  const engine = await engineType(database, table)
  if (engine.includes('MergeTree') === false) return <></>

  const { data: columns } = await fetchData<Row[]>({
    query: queryConfig.sql,
    query_params: {
      database,
      table,
    },
  })

  return (
    <DataTable
      title={`Table: ${database}.${table}`}
      description={<TableComment database={database} table={table} />}
      toolbarExtras={<Extras host={host} database={database} table={table} />}
      topRightToolbarExtras={<Toolbar database={database} table={table} />}
      queryConfig={queryConfig}
      data={columns}
    />
  )
}
