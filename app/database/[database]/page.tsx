import { ColumnFormat } from '@/components/data-table/column-defs'
import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { type RowData } from '@tanstack/react-table'

import { listTables } from '../../database/queries'
import { Toolbar } from './toolbar'

interface TableListProps {
  params: {
    database: string
  }
}

export default async function TableListPage({
  params: { database },
}: TableListProps) {
  const config: QueryConfig = {
    name: 'tables',
    sql: listTables,
    columns: [
      'table',
      'engine',
      'readable_compressed',
      'readable_uncompressed',
      'compr_rate',
      'readable_total_rows',
      'readable_avg_part_size',
      'parts_count',
      'detached_parts_count',
      'readable_detached_bytes_on_disk',
      'comment',
      'action',
    ],
    columnFormats: {
      part_count: ColumnFormat.Number,
      detached_parts_count: [
        ColumnFormat.Link,
        { href: `/detached_parts/?table=${database}.[table]` },
      ],
      table: [ColumnFormat.Link, { href: `/database/${database}/[table]` }],
      engine: ColumnFormat.ColoredBadge,
      readable_compressed: ColumnFormat.BackgroundBar,
      readable_uncompressed: ColumnFormat.BackgroundBar,
      readable_total_rows: ColumnFormat.BackgroundBar,
      readable_avg_part_size: ColumnFormat.BackgroundBar,
      compr_rate: ColumnFormat.BackgroundBar,
      action: [ColumnFormat.Action, ['optimize']],
    },
  }

  const { data } = await fetchData<RowData[]>({
    query: config.sql,
    format: 'JSONEachRow',
    query_params: { database },
  })

  return (
    <DataTable
      title={`Database: ${database}`}
      config={config}
      data={data}
      topRightToolbarExtras={<Toolbar database={database} />}
    />
  )
}
