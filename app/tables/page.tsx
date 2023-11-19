import { fetchData } from '@/lib/clickhouse'
import { getQueryConfigByName, queries } from '@/lib/clickhouse-queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table/data-table'
import { RelatedCharts } from '@/components/related-charts'

export const dynamic = 'force-dynamic'
export const revalidate = 5

export default async function TablePage() {
  let databases: string[] = []
  try {
    const data = await fetchData(
      "SELECT name FROM system.databases WHERE engine != 'Memory'"
    )
    databases = data.map((row) => row.name)

    if (!databases.length) {
      return <div>Empty</div>
    }
  } catch (e: any) {
    return <div>Could not getting list database, error: ${e}</div>
  }

  // Get the query config
  const config = getQueryConfigByName('tables')
  if (!config) {
    return <div>404</div>
  }

  // Fetch the data from ClickHouse
  const data = await fetchData(config.sql)

  return (
    <div className="flex flex-col">
      <RelatedCharts relatedCharts={config.relatedCharts} />
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
