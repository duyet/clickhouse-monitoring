import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

import { fetchData } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { Button } from '@/components/ui/button'
import { ColumnFormat } from '@/components/data-table/columns'
import { DataTable } from '@/components/data-table/data-table'

import { AlternativeTables } from './alternative-tables'
import { SampleData } from './sample-data'
import { ShowDDL } from './show-ddl-button'
import { TableInfo } from './table-info'

const config: QueryConfig = {
  name: 'columns',
  sql: `
    SELECT database,
           table,
           column,
           type,
           sum(column_data_compressed_bytes) as compressed_bytes,
           sum(column_data_uncompressed_bytes) AS uncompressed_bytes,
           formatReadableSize(compressed_bytes) AS compressed,
           formatReadableSize(uncompressed_bytes) AS uncompressed,
           round(uncompressed_bytes / compressed_bytes, 2) AS compr_ratio,
           sum(rows) AS rows_cnt,
           formatReadableQuantity(rows_cnt) AS readable_rows_cnt,
           round(uncompressed_bytes / rows_cnt, 2) avg_row_size
     FROM system.parts_columns
     WHERE (active = 1)
       AND (database = {database: String})
       AND (table = {table: String})
     GROUP BY database,
              table,
              column,
              type
     ORDER BY compressed_bytes DESC
  `,
  columns: [
    'table',
    'column',
    'type',
    'compressed',
    'uncompressed',
    'compr_ratio',
    'readable_rows_cnt',
    'avg_row_size',
  ],
  columnFormats: {
    part_count: ColumnFormat.Number,
  },
}

const Extras = ({ database, table }: { database: string; table: string }) => (
  <div className="mb-3 flex flex-row gap-3">
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
    <ShowDDL database={database} table={table} />
    <TableInfo database={database} table={table} />
    <SampleData database={database} table={table} />
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
    return 'MaterializedView'
  } else if (engine?.[0]?.engine === 'Dictionary') {
    return (
      <div className="flex flex-col">
        <Extras database={database} table={table} />

        <div className="mt-3 w-fit overflow-auto">
          <h2 className="text-lg font-semibold">Dictionary definition</h2>
          <pre className="text-sm">...</pre>
        </div>

        <div className="mt-3 w-fit overflow-auto">
          <h2 className="text-lg font-semibold">Dictionary usage</h2>
          <pre className="text-sm">...</pre>
        </div>
      </div>
    )
  }

  const columns = await fetchData(config.sql, {
    database,
    table,
  })

  return (
    <DataTable
      title={`${database}.${table}`}
      extras={<Extras database={database} table={table} />}
      config={config}
      data={columns}
    />
  )
}
