import { ArrowLeftIcon, TextAlignBottomIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

import { DataTable } from '@/components/data-table/data-table'
import { ServerComponentLazy } from '@/components/server-component-lazy'
import { Button } from '@/components/ui/button'
import { fetchDataWithCache } from '@/lib/clickhouse'

import { config } from './config'
import { AlternativeTables } from './extras/alternative-tables'
import { RunningQueriesButton } from './extras/runnning-queries-button'
import { SampleData } from './extras/sample-data'
import { SampleDataButton } from './extras/sample-data-button'
import { ShowDDL } from './extras/show-ddl-button'
import { TableDDL } from './extras/table-ddl'
import { TableInfo } from './extras/table-info'

export const revalidate = 600

interface ColumnsPageProps {
  params: {
    database: string
    table: string
  }
}

export default async function ColumnsPage({
  params: { database, table },
}: ColumnsPageProps) {
  // Detect engine
  const resp = await fetchDataWithCache()(
    `
      SELECT engine
        FROM system.tables
       WHERE (database = {database: String})
         AND (name = {table: String})
    `,
    { database, table }
  )
  const engine = resp?.[0]?.engine || ''

  if (engine === 'MaterializedView') {
    return (
      <div className="flex flex-col">
        <Extras database={database} table={table} />

        <div className="mt-3 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">
            MaterializedView:{' '}
            <code>
              {database}.{table}
            </code>
          </h2>
          <TableDDL database={database} table={table} />
        </div>
      </div>
    )
  } else if (engine === 'View') {
    return (
      <div className="flex flex-col">
        <Extras database={database} table={table} />

        <div className="mt-3 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">View definition:</h2>

          <TableDDL database={database} table={table} />
        </div>
      </div>
    )
  } else if (engine === 'Dictionary') {
    const dictUsage = `SELECT dictGet('${database}.${table}', 'key', 'value')`

    return (
      <div className="flex flex-col">
        <Extras database={database} table={table} />

        <div className="mt-6 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">Dictionary Usage</h2>
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
  } else {
    const columns = await fetchDataWithCache()(config.sql, {
      database,
      table,
    })

    let description = ''
    try {
      const raw = await fetchDataWithCache()(
        `
        SELECT comment
          FROM system.tables
         WHERE (database = {database: String})
           AND (name = {table: String})
      `,
        { database, table }
      )
      description = raw?.[0]?.comment || ''
    } catch (e) {
      console.error('Error fetching table description', e)
    }

    return (
      <div>
        <DataTable
          title={`Table: ${database}.${table}`}
          description={description}
          extras={<Extras database={database} table={table} />}
          toolbarExtras={<ToolbarExtras database={database} table={table} />}
          config={config}
          data={columns}
        />

        <ServerComponentLazy>
          <div className="mt-5 w-fit overflow-auto">
            <h2 className="text-lg font-semibold">Sample Data</h2>
            <SampleData database={database} table={table} limit={5} />
          </div>
        </ServerComponentLazy>
      </div>
    )
  }
}

const Extras = ({ database, table }: { database: string; table: string }) => (
  <div className="mb-3 flex flex-row justify-between gap-3">
    <div className="flex flex-row gap-3">
      <Link href={`/database/${database}`}>
        <Button
          variant="outline"
          size="sm"
          className="flex flex-row gap-2 text-muted-foreground"
        >
          <ArrowLeftIcon className="size-3" />
          Back to {database}
        </Button>
      </Link>
      <AlternativeTables database={database} table={table} />
    </div>

    <div className="flex flex-row gap-3">
      <ShowDDL database={database} table={table} />
      <TableInfo database={database} table={table} />
      <SampleDataButton database={database} table={table} />
      <RunningQueriesButton database={database} table={table} />
    </div>
  </div>
)

const ToolbarExtras = ({
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
