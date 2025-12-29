'use client'

import { Suspense, lazy } from 'react'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { useHostId } from '@/lib/swr'
import { mutationsConfig } from '@/lib/query-config/merges/mutations'

// Lazy load chart components for code splitting
const ChartSummaryUsedByMutations = lazy(() =>
  import('@/components/charts/summary-used-by-mutations').then((m) => ({
    default: m.default,
  }))
)
const ChartMergeCount = lazy(() =>
  import('@/components/charts/merge-count').then((m) => ({
    default: m.ChartMergeCount,
  }))
)

export default function MutationsPage() {
  const hostId = useHostId()
  const relatedCharts = mutationsConfig.relatedCharts || []

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
              case 'summary-used-by-mutations':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartSummaryUsedByMutations
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'merge-count':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartMergeCount
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
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
          title="Mutations"
          description={mutationsConfig.description}
          queryConfig={mutationsConfig}
        />
      </Suspense>
    </div>
  )
}
