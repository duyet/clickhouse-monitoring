import { ColumnFormat } from '@/components/data-table/column-defs'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { fetchData } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { TextAlignBottomIcon } from '@radix-ui/react-icons'
import { type RowData } from '@tanstack/react-table'
import Link from 'next/link'

import { listTables } from '../../database/queries'

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

  const tables = await fetchData<RowData[]>({
    query: config.sql,
    format: 'JSONEachRow',
    query_params: { database },
  })

  return (
    <DataTable
      title={`Database: ${database}`}
      config={config}
      data={tables}
      topRightToolbarExtras={<ToolbarExtras database={database} />}
    />
  )
}

const ToolbarExtras = ({ database }: { database: string }) => (
  <Link href={`/top-usage-tables?database=${database}`}>
    <Button
      variant="outline"
      className="flex flex-row gap-2 text-muted-foreground"
    >
      <TextAlignBottomIcon className="size-3" />
      Top usage tables
    </Button>
  </Link>
)
