import { unstable_noStore as noStore } from 'next/cache'

import { fetchData } from '@/lib/clickhouse'
import { getQueryConfigByName, queries } from '@/lib/clickhouse-queries'
import { cn } from '@/lib/utils'
import { DataTable } from '@/components/data-table/data-table'

interface PageProps {
  params: {
    name: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 5

export default async function Page({ params: { name } }: PageProps) {
  noStore()

  // Get the query config
  const config = getQueryConfigByName(name)
  if (!config) {
    return <div>404</div>
  }

  // Fetch the data from ClickHouse
  const data = await fetchData(config.sql)

  // Related charts
  const charts = []
  if (config.relatedCharts) {
    for (const chart of config.relatedCharts) {
      const chartsModule = await import(`@/components/charts/${chart}`)
      charts.push(chartsModule.default)
    }
  }

  const chartWidth = charts.length > 1 ? `w-1/${charts.length}` : 'w-full'

  return (
    <div className="flex flex-col">
      {charts.length > 0 ? (
        <div className="mb-5 flex flex-row gap-5">
          {charts.map((Chart, i) => (
            <Chart
              key={i}
              className={cn(chartWidth, 'p-0 shadow-none')}
              chartClassName="h-44"
            />
          ))}
        </div>
      ) : null}

      <div>
        <DataTable title={name.replace('-', ' ')} config={config} data={data} />
      </div>
    </div>
  )
}

export const generateStaticParams = async () =>
  queries.map(({ name }) => ({
    name,
  }))
