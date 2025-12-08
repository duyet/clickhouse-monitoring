import { engineType } from '../engine-type'
import { Extras } from '../extras/extras'
import { TableDDL } from '../extras/table-ddl'

interface Props {
  params: Promise<{
    host: string
    database: string
    table: string
  }>
}

export default async function View({ params }: Props) {
  const { host, database, table } = await params

  const engine = await engineType(database, table)
  if (engine !== 'View') return <></>

  return (
    <div className="flex flex-col">
      <Extras host={host} database={database} table={table} />

      <div className="mt-3 w-fit overflow-auto">
        <h2 className="mb-3 text-lg font-semibold">View definition:</h2>
        <TableDDL database={database} table={table} />
      </div>
    </div>
  )
}
