import { ChartCard } from '@/components/generic-charts/chart-card'
import { GithubHeatmapChart } from '@/components/github-heatmap-chart'
import { AreaChart } from '@/components/tremor/area'
import { BarChart } from '@/components/tremor/bar'
import { fetchData } from '@/lib/clickhouse'

interface RenderChartProps {
  kind: string
  title: string
  query: string
  params: any
  colors?: string[]
  className?: string
  chartClassName?: string
  hostId: number
}

export const RenderChart = async ({
  kind,
  title,
  query,
  params,
  colors = [
    'indigo-300',
    'rose-200',
    '#ffcc33',
    'green-300',
    'blue-300',
    'purple-300',
    'pink-300',
    'yellow-300',
    'red-300',
    'gray-300',
  ],
  className,
  chartClassName,
  hostId,
}: RenderChartProps) => {
  const { data, error } = await fetchData<{ [key: string]: string | number }[]>(
    {
      query,
      query_params: params,
      hostId,
    }
  )

  if (error) {
    return (
      <div className="rounded border p-4">
        <div className="text-sm text-red-600">Error: {error.message}</div>
      </div>
    )
  }

  // event_time is a must
  if (!data || !data[0]?.event_time) {
    return (
      <div>
        <code>event_time</code> column is a must from query result
      </div>
    )
  }

  // Categories: all columns except event_time
  const categories = Object.keys(data[0]).filter((c) => c !== 'event_time')

  if (kind === 'area') {
    return (
      <ChartCard title={title} className={className} sql={query} data={data}>
        <AreaChart
          className={chartClassName}
          data={data}
          index="event_time"
          categories={categories}
          stack
          colors={colors}
          showGridLines={true}
          showYAxis={true}
        />
      </ChartCard>
    )
  }

  if (kind === 'bar') {
    return (
      <ChartCard title={title} className={className} sql={query} data={data}>
        <BarChart
          className={chartClassName}
          data={data}
          index="event_time"
          categories={categories}
          stack
          showGridLines={true}
          showYAxis={true}
          colors={colors}
        />
      </ChartCard>
    )
  }

  if (kind === 'calendar') {
    return (
      <ChartCard title={title} className={className} sql={query} data={data}>
        <GithubHeatmapChart
          className={chartClassName}
          data={data}
          index="event_time"
          colors={colors}
        />
      </ChartCard>
    )
  }

  return <div>Unknown kind: {kind}</div>
}
