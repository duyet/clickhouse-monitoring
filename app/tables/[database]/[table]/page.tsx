import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { fetchData, fetchDataWithCache } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { Button } from '@/components/ui/button'
import { ColumnFormat } from '@/components/data-table/column-defs'
import { DataTable } from '@/components/data-table/data-table'
import { ServerComponentLazy } from '@/components/server-component-lazy'

import { AlternativeTables } from './extras/alternative-tables'
import { RunningQueriesButton } from './extras/runnning-queries-button'
import { SampleData } from './extras/sample-data'
import { SampleDataButton } from './extras/sample-data-button'
import { ShowDDL } from './extras/show-ddl-button'
import { TableDDL } from './extras/table-ddl'
import { TableInfo } from './extras/table-info'

const config: QueryConfig = {
  name: 'columns',
  sql: `
    WITH columns AS (
      SELECT database,
             table,
             name as column,
             compression_codec as codec,
             (default_kind || ' ' || default_expression) as default_expression
      FROM system.columns
      WHERE (database = {database: String})
        AND (table = {table: String})
    ),
    summary AS (
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
             round(uncompressed / rows_cnt, 2) avg_row_size,
             round(100 * compressed / max(compressed) OVER ()) AS pct_compressed,
             round(100 * uncompressed / max(uncompressed) OVER()) AS pct_uncompressed,
             round(100 * rows_cnt / max(rows_cnt) OVER ()) AS pct_rows_cnt,
             round(100 * compr_ratio / max(compr_ratio) OVER ()) AS pct_compr_ratio
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
    SELECT s.*, c.codec, c.default_expression
    FROM summary s
    LEFT OUTER JOIN columns c USING (database, table, column)
  `,
  columns: [
    'column',
    'type',
    'readable_compressed',
    'readable_uncompressed',
    'compr_ratio',
    'readable_rows_cnt',
    'avg_row_size',
    'codec',
  ],
  columnFormats: {
    type: ColumnFormat.Code,
    codec: ColumnFormat.Code,
    part_count: ColumnFormat.Number,
    readable_compressed: ColumnFormat.BackgroundBar,
    readable_uncompressed: ColumnFormat.BackgroundBar,
    compr_ratio: ColumnFormat.BackgroundBar,
    readable_rows_cnt: ColumnFormat.BackgroundBar,
    default_expression: ColumnFormat.Code,
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
      <RunningQueriesButton database={database} table={table} />
    </div>
  </div>
)

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
  const engine = await fetchDataWithCache(
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
    const dictUsage = `SELECT dictGet('${database}.${table}', 'key', 'value')`

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
            <code>{dictUsage}</code>
          </pre>
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
    const columns = await fetchDataWithCache(config.sql, {
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
