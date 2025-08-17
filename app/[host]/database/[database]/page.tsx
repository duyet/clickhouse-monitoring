import { type RowData } from '@tanstack/react-table'

import { DataTable } from '@/components/data-table/data-table'
import { fetchData } from '@/lib/clickhouse'
import { ColumnFormat } from '@/types/column-format'
import { type QueryConfig } from '@/types/query-config'

import { listTables } from '../queries'
import { Toolbar } from './toolbar'

interface TableListProps {
  params: Promise<{
    host: number
    database: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function TableListPage({ params }: TableListProps) {
  const { host, database } = await params
  const queryConfig: QueryConfig = {
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
        { href: `/${host}/detached_parts/?table=${database}.[table]` },
      ],
      table: [
        ColumnFormat.Link,
        {
          href: `/${host}/database/${database}/[table]`,
          className: 'truncate max-w-48',
        },
      ],
      engine: [ColumnFormat.ColoredBadge, { className: 'truncate max-w-40' }],
      readable_compressed: ColumnFormat.BackgroundBar,
      readable_uncompressed: ColumnFormat.BackgroundBar,
      readable_total_rows: ColumnFormat.BackgroundBar,
      readable_avg_part_size: ColumnFormat.BackgroundBar,
      compr_rate: ColumnFormat.BackgroundBar,
      comment: [
        ColumnFormat.Text,
        {
          className: 'line-clamp-1	hover:text-nowrap',
        },
      ],
      action: [ColumnFormat.Action, ['optimize']],
    },
  }

  const { data } = await fetchData<RowData[]>({
    query: queryConfig.sql,
    format: 'JSONEachRow',
    query_params: { database },
    hostId: host,
  })

  return (
    <DataTable
      title={`${database}`}
      queryConfig={queryConfig}
      data={data}
      context={{ host: `${host}`, database }}
      topRightToolbarExtras={<Toolbar database={database} />}
    />
  )
}
