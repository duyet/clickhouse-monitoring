import { fetchData } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { TabsContent } from '@/components/ui/tabs'
import { ColumnFormat } from '@/components/data-table/column-defs'
import { DataTable } from '@/components/data-table/data-table'

import { listTables } from '../queries'

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
      'part_count',
      'comment',
    ],
    columnFormats: {
      part_count: ColumnFormat.Number,
      table: [ColumnFormat.Link, { href: `/tables/${database}/[table]` }],
      engine: ColumnFormat.ColoredBadge,
      readable_compressed: ColumnFormat.BackgroundBar,
      readable_uncompressed: ColumnFormat.BackgroundBar,
      readable_total_rows: ColumnFormat.BackgroundBar,
      compr_rate: ColumnFormat.BackgroundBar,
    },
  }

  const tables = await fetchData(config.sql, { database })

  return (
    <TabsContent value={database}>
      <DataTable title={database} config={config} data={tables} />
    </TabsContent>
  )
}
