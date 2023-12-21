import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { fetchData } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { Button } from '@/components/ui/button'
import { ColumnFormat } from '@/components/data-table/columns'
import { DataTable } from '@/components/data-table/data-table'

import { AlternativeTables } from './alternative-tables'
import { SampleData } from './sample-data'
import { SampleDataButton } from './sample-data-button'
import { ShowDDL } from './show-ddl-button'
import { TableDDL } from './table-ddl'
import { TableInfo } from './table-info'

const config: QueryConfig = {
  name: 'columns',
  sql: `
    WITH summary AS (
      SELECT database,
             table,
             column,
             type,
             sum(column_data_compressed_bytes) as compressed,
             sum(column_data_uncompressed_bytes) AS uncompressed,
             formatReadableSize(compressed) AS readable_compressed,
             formatReadableSize(uncompressed) AS readable_uncompressed,
             round(uncompressed / compressed, 2) AS compr_ratio,
             sum(rows) AS rows_cnt,
             formatReadableQuantity(rows_cnt) AS readable_rows_cnt,
             round(uncompressed / rows_cnt, 2) avg_row_size
      FROM system.parts_columns
      WHERE (active = 1)
        AND (database = {database: String})
        AND (table = {table: String})
      GROUP BY database,
               table,
               column,
               type
      ORDER BY compressed DESC
    )
    SELECT *,
           100 * compressed / (SELECT sum(compressed) FROM summary) AS pct_compressed,
           100 * uncompressed / (SELECT sum(uncompressed) FROM summary) AS pct_uncompressed,
           100 * rows_cnt / (SELECT sum(rows_cnt) FROM summary) AS pct_rows_cnt,
           100 * compr_ratio / (SELECT sum(compr_ratio) FROM summary) AS pct_compr_ratio
    FROM summary
  `,
  columns: [
    'table',
    'column',
    'type',
    'readable_compressed',
    'readable_uncompressed',
    'compr_ratio',
    'readable_rows_cnt',
    'avg_row_size',
  ],
  columnFormats: {
    part_count: ColumnFormat.Number,
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    compr_ratio: ColumnFormat.BackgroundBar,
    readable_rows_cnt: ColumnFormat.BackgroundBar,
  },
}

const Extras = ({ database, table }: { database: string; table: string }) => (
  <div className="mb-3 flex flex-row justify-between gap-3">
    <div className="flex flex-row gap-3">
      <Link href={`/tables/${database}`}>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground flex flex-row gap-2"
        >
          <ArrowLeftIcon className="h-3 w-3" />
          Back to {database}
        </Button>
      </Link>
      <AlternativeTables database={database} table={table} />
    </div>

    <div className="flex flex-row gap-3">
      <ShowDDL database={database} table={table} />
      <TableInfo database={database} table={table} />
      <SampleDataButton database={database} table={table} />
    </div>
  </div>
)

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
  const engine = await fetchData(
    `
      SELECT engine
        FROM system.tables
       WHERE (database = {database: String})
         AND (name = {table: String})
    `,
    { database, table }
  )

  if (engine?.[0]?.engine === 'MaterializedView') {
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
  } else if (engine?.[0]?.engine === 'Dictionary') {
    return (
      <div className="flex flex-col">
        <Extras database={database} table={table} />

        <div className="mt-3 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">Dictionary DDL</h2>
          <TableDDL database={database} table={table} />
        </div>

        <div className="mt-6 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">Dictionary Usage</h2>
          <pre className="text-sm">
            <code>
              SELECT dictGet(&apos;{database}.{table}&apos;, &apos;key&apos;,
              &apos;value&apos;);
            </code>
          </pre>
        </div>

        <div className="mt-6 w-fit overflow-auto">
          <h2 className="mb-3 text-lg font-semibold">Sample Data</h2>
          <SampleData database={database} table={table} />
        </div>
      </div>
    )
  }

  const columns = await fetchData(config.sql, {
    database,
    table,
  })

  return (
    <div>
      <DataTable
        title={`${database}.${table}`}
        extras={<Extras database={database} table={table} />}
        config={config}
        data={columns}
      />

      <div className="mt-5 w-fit overflow-auto">
        <h2 className="text-lg font-semibold">Sample Data</h2>
        <SampleData database={database} table={table} limit={5} />
      </div>
    </div>
  )
}
