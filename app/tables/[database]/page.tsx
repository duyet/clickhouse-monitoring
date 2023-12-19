import { fetchData } from '@/lib/clickhouse'
import { type QueryConfig } from '@/lib/types/query-config'
import { TabsContent } from '@/components/ui/tabs'
import { ColumnFormat } from '@/components/data-table/columns'
import { DataTable } from '@/components/data-table/data-table'

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
    sql: `
    SELECT
        database,
        table,
        engine,
        sum(data_compressed_bytes) as compressed_bytes,
        sum(data_uncompressed_bytes) AS uncompressed_bytes,
        formatReadableSize(compressed_bytes) AS compressed,
        formatReadableSize(uncompressed_bytes) AS uncompressed,
        round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
        sum(rows) AS total_rows,
        formatReadableQuantity(sum(rows)) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE active = 1 AND database = {database: String}
    GROUP BY database,
             table,
             engine
    ORDER BY database, compressed_bytes DESC
  `,
    columns: [
      'table',
      'engine',
      'compressed',
      'uncompressed',
      'compr_rate',
      'readable_total_rows',
      'part_count',
    ],
    columnFormats: {
      part_count: ColumnFormat.Number,
      table: [ColumnFormat.Link, { href: `/tables/${database}/[table]` }],
      engine: ColumnFormat.ColoredBadge,
    },
  }

  const tables = await fetchData(config.sql, { database })

  return (
    <TabsContent value={database}>
      <DataTable title={database} config={config} data={tables} />
    </TabsContent>
  )
}
