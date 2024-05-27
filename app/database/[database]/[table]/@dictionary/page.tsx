import { ServerComponentLazy } from '@/components/server-component-lazy'
import { engineType } from '../engine-type'
import { Extras } from '../extras/extras'
import { SampleData } from '../extras/sample-data'
import { TableDDL } from '../extras/table-ddl'

interface Props {
  params: {
    database: string
    table: string
  }
}

export default async function Dictionary({
  params: { database, table },
}: Props) {
  const engine = await engineType(database, table)
  if (engine !== 'Dictionary') return <></>

  const dictUsage = `SELECT dictGet('${database}.${table}', 'key', 'value')`

  return (
    <div className="flex flex-col">
      <Extras database={database} table={table} />

      <div className="mt-6 w-fit overflow-auto">
        <h2 className="mb-3 text-lg font-semibold">Dictionary usage</h2>
        <pre className="text-sm">
          <code>{dictUsage}</code>
        </pre>
      </div>

      <div className="mt-3 w-fit overflow-auto">
        <h2 className="mb-3 text-lg font-semibold">Dictionary DDL</h2>
        <TableDDL database={database} table={table} />
      </div>

      <ServerComponentLazy>
        <div className="mt-6 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">Sample Data</h2>
          <SampleData database={database} table={table} />
        </div>
      </ServerComponentLazy>
    </div>
  )
}
