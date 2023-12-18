import { fetchData } from '@/lib/clickhouse'
import type { QueryConfig } from '@/lib/types/query-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColumnFormat } from '@/components/data-table/columns'
import { DataTable } from '@/components/data-table/data-table'
import { ErrorAlert } from '@/components/error-alert'

export const dynamic = 'force-dynamic'
export const revalidate = 30

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
    WHERE active = 1
    GROUP BY database,
             table,
             engine
    ORDER BY database, compressed_bytes DESC
  `,
  columns: [
    'database',
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
    table: [ColumnFormat.Link, { href: '/tables/[database]/[table]' }],
    engine: ColumnFormat.ColoredBadge,
  },
}

interface TablePageProps {
  params: {
    database: string
  }
}

export default async function TablePage({
  params: { database },
}: TablePageProps) {
  let databases: { name: string; count: number }[] = []
  try {
    // List database names and number of tables
    databases = await fetchData(`
      SELECT d.name as name,
             countDistinct(t.name) as count
      FROM system.databases AS d
      LEFT JOIN system.tables AS t ON d.name = t.database
      WHERE d.engine = 'Atomic' 
            /* some system tables do not have parts information */
            AND d.name IN (SELECT database FROM system.parts WHERE active = 1)
            AND t.name IN (SELECT table FROM system.parts WHERE active = 1)
      GROUP BY d.name
    `)

    if (!databases.length) {
      return <ErrorAlert title="Message" message="Empty" />
    }
  } catch (e: any) {
    return (
      <ErrorAlert title="Could not getting list database" message={`${e}`} />
    )
  }

  // Fetching all tables
  const tables = await fetchData(config.sql)

  return (
    <div className="flex flex-col">
      <div>
        <Tabs defaultValue={databases[0].name} className="w-full">
          <TabsList className="mb-3">
            {databases.map(({ name, count }) => (
              <TabsTrigger key={name} value={name}>
                {name} ({count})
              </TabsTrigger>
            ))}
          </TabsList>

          {databases.map(({ name }) => (
            <TabsContent key={name} value={name}>
              <DataTable
                title={name}
                config={config}
                data={tables.filter((table) => table.database == name)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
