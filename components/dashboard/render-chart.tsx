'use client'

import { ChartCard } from '@/components/cards/chart-card'
import { ChartError } from '@/components/charts/chart-error'
import { GithubHeatmapChart } from '@/components/charts/github-heatmap-chart'
import { AreaChart } from '@/components/charts/primitives/area'
import { BarChart } from '@/components/charts/primitives/bar'
import { ChartSkeleton } from '@/components/skeletons'
import { useFetchData } from '@/lib/swr'

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

export const RenderChart = ({
  kind,
  title,
  query,
  params,
  colors = [
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
    '--chart-6',
    '--chart-7',
    '--chart-8',
    '--chart-9',
    '--chart-10',
  ],
  className,
  chartClassName,
  hostId,
}: RenderChartProps) => {
  const { data, isLoading, error, refresh } = useFetchData<
    {
      [key: string]: string | number
    }[]
  >(query, params, hostId, 30000) // refresh every 30 seconds

  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  if (error) {
    return <ChartError error={error} title={title} onRetry={refresh} />
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
          showCartesianGrid={true}
          showYAxis={true}
          showXAxis={true}
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
          colors={colors}
          showYAxis={true}
          showXAxis={true}
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
