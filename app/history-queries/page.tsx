'use client'

import { Suspense, lazy } from 'react'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { useHostId } from '@/lib/swr'
import { historyQueriesConfig } from '@/lib/query-config/queries/history-queries'

// Lazy load chart components for code splitting
const ChartQueryCount = lazy(() =>
  import('@/components/charts/query-count').then((m) => ({
    default: m.ChartQueryCount,
  }))
)
const ChartQueryDuration = lazy(() =>
  import('@/components/charts/query-duration').then((m) => ({
    default: m.default,
  }))
)
const ChartQueryMemory = lazy(() =>
  import('@/components/charts/query-memory').then((m) => ({
    default: m.default,
  }))
)
const ChartQueryCountByUser = lazy(() =>
  import('@/components/charts/query-count-by-user').then((m) => ({
    default: m.ChartQueryCountByUser,
  }))
)

export default function HistoryQueriesPage() {
  const hostId = useHostId()
  const relatedCharts = historyQueriesConfig.relatedCharts || []

  return (
    <div className="flex flex-col gap-4">
      {/* Related Charts */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {relatedCharts.map((chartConfig, index) => {
          if (!chartConfig) return null

          // Handle break directive
          if (typeof chartConfig === 'string' && chartConfig === 'break') {
            return <div key={`break-${index}`} className="md:col-span-2" />
          }

          // Extract chart name and props
          const chartName = Array.isArray(chartConfig)
            ? chartConfig[0]
            : chartConfig
          const chartProps = Array.isArray(chartConfig)
            ? chartConfig[1] || {}
            : {}

          // Render appropriate chart component
          const renderChart = () => {
            switch (chartName) {
              case 'query-count':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartQueryCount
                      hostId={hostId}
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'query-duration':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartQueryDuration
                      hostId={hostId}
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'query-memory':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartQueryMemory
                      hostId={hostId}
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'query-count-by-user':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartQueryCountByUser
                      hostId={hostId}
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      {...chartProps}
                    />
                  </Suspense>
                )
              default:
                return null
            }
          }

          // Calculate column span for responsive layout
          const isLastChart = index === relatedCharts.length - 1
          const colSpan = isLastChart && index % 2 === 1 ? 'md:col-span-2' : ''

          return (
            <div key={`${chartName}-${index}`} className={colSpan}>
              {renderChart()}
            </div>
          )
        })}
      </div>

      {/* Table */}
      <Suspense fallback={<TableSkeleton />}>
        <TableClient
          title="History Queries"
          description={historyQueriesConfig.description}
          queryConfig={historyQueriesConfig}
        />
      </Suspense>
    </div>
  )
}
