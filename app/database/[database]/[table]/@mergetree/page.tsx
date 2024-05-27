import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { fetchDataWithCache } from '@/lib/clickhouse'
import { Extras } from '../extras/extras'

import { config, type Row } from '../config'
import { engineType } from '../engine-type'

interface Props {
  params: {
    database: string
    table: string
  }
}

export default async function MergeTree({
  params: { database, table },
}: Props) {
  const engine = await engineType(database, table)
  if (engine.includes('MergeTree') === false) return <></>

  const columns = await fetchDataWithCache()<Row[]>({
    query: config.sql,
    query_params: {
      database,
      table,
    },
  })

  let description = ''
  try {
    const raw = await fetchDataWithCache()<{ comment: string }[]>({
      query: `
          SELECT comment
            FROM system.tables
           WHERE (database = {database: String})
             AND (name = {table: String})
        `,
      query_params: { database, table },
    })

    description = raw?.[0]?.comment || ''
  } catch (e) {
    console.error('Error fetching table description', e)
  }

  return (
    <DataTable
      title={`Table: ${database}.${table}`}
      description={description}
      toolbarExtras={<Extras database={database} table={table} />}
      topRightToolbarExtras={
        <TopRightToolbarExtras database={database} table={table} />
      }
      config={config}
      data={columns}
    />
  )
}

const TopRightToolbarExtras = ({
  database,
  table,
}: {
  database: string
  table: string
}) => (
  <Link href={`/top-usage-columns?table=${database}.${table}`}>
    <Button
      variant="outline"
      className="flex flex-row gap-2 text-muted-foreground"
    >
      <TextAlignBottomIcon className="size-3" />
      Top usage columns
    </Button>
  </Link>
)
