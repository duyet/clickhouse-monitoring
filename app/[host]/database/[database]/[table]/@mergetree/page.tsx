import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Extras } from '../extras/extras'

import { fetchData } from '@/lib/clickhouse'
import { getScopedLink } from '@/lib/scoped-link'
import { config, type Row } from '../config'
import { engineType } from '../engine-type'

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
    query: config.sql,
    query_params: {
      database,
      table,
    },
  })

  return (
    <DataTable
      title={`Table: ${database}.${table}`}
      description={<Description database={database} table={table} />}
      toolbarExtras={<Extras host={host} database={database} table={table} />}
      topRightToolbarExtras={
        <TopRightToolbarExtras database={database} table={table} />
      }
      config={config}
      data={columns}
    />
  )
}

async function Description({
  database,
  table,
}: {
  database: string
  table: string
}) {
  try {
    const { data } = await fetchData<{ comment: string }[]>({
      query: `
          SELECT comment
            FROM system.tables
           WHERE (database = {database: String})
             AND (name = {table: String})
        `,
      query_params: { database, table },
    })

    return data?.[0]?.comment || ''
  } catch (e) {
    console.error('Error fetching table description', e)
    return ''
  }
}

const TopRightToolbarExtras = ({
  database,
  table,
}: {
  database: string
  table: string
}) => (
  <Link href={getScopedLink(`/top-usage-columns?table=${database}.${table}`)}>
    <Button
      variant="outline"
      className="flex flex-row gap-2 text-muted-foreground"
    >
      <TextAlignBottomIcon className="size-3" />
      Top usage columns
    </Button>
  </Link>
)
