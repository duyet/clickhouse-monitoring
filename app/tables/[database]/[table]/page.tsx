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

interface ColumnsPageProps {
  params: {
    database: string
    table: string
  }
}

export default async function ColumnsPage({
  params: { database, table },
}: ColumnsPageProps) {
  const columns = await fetchData(config.sql, {
    database,
    table,
  })

  return (
    <div className="flex flex-col">
      <div>
        <DataTable
          title={`${database}.${table}`}
          extras={
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
          }
          config={config}
          data={columns}
        />
      </div>
    </div>
  )
}
