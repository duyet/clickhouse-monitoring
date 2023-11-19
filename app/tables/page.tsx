import { fetchData } from '@/lib/clickhouse'
import type { QueryConfig } from '@/lib/types/query-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table/data-table'

export const dynamic = 'force-dynamic'
export const revalidate = 5

const config: QueryConfig = {
  name: 'tables',
  sql: `
    SELECT database,
        table,
        sum(data_compressed_bytes) as compressed_bytes,
        sum(data_uncompressed_bytes) AS uncompressed_bytes,
        formatReadableSize(compressed_bytes) AS compressed,
        formatReadableSize(uncompressed_bytes) AS uncompressed,
        round(uncompressed_bytes / compressed_bytes, 2) AS compr_rate,
        sum(rows) AS total_rows,
        formatReadableQuantity(sum(rows)) AS readable_total_rows,
        count() AS part_count
    FROM system.parts
    WHERE (active = 1)
      AND (database != 'system')
      AND (table LIKE '%')
    GROUP BY database,
             table
    ORDER BY database, compressed_bytes DESC
  `,
  columns: [
    'table',
    'compressed',
    'uncompressed',
    'compr_rate',
    'readable_total_rows',
    'part_count',
  ],
}

export default async function TablePage() {
  let databases: string[] = []
  try {
    const data = await fetchData(
      "SELECT name FROM system.databases WHERE engine = 'Atomic'"
    )
    databases = data.map((row) => row.name)

    if (!databases.length) {
      return <div>Empty</div>
    }
  } catch (e: any) {
    return <div>Could not getting list database, error: ${e}</div>
  }

  // Fetch the data from ClickHouse
  const data = await fetchData(config.sql)

  return (
    <div className="flex flex-col">
      <div>
        <Tabs defaultValue={databases[0]} className="w-full">
          <TabsList className="mb-3">
            {databases.map((name) => (
              <TabsTrigger key={name} value={name}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>

          {databases.map((name) => (
            <TabsContent key={name} value={name}>
              <DataTable
                title={name}
                config={config}
                data={data.filter((table) => table.database == name)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
