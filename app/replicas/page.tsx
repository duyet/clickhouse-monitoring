'use client'

import { Suspense, lazy } from 'react'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { useHostId } from '@/lib/swr'
import { replicasConfig } from '@/lib/query-config/tables/replicas'

// Lazy load chart components for code splitting
const ChartReplicationQueueCount = lazy(() =>
  import('@/components/charts/replication-queue-count').then((m) => ({
    default: m.default,
  }))
)
const ChartReplicationSummaryTable = lazy(() =>
  import('@/components/charts/replication-summary-table').then((m) => ({
    default: m.default,
  }))
)

export default function ReplicasPage() {
  const hostId = useHostId()
  const relatedCharts = replicasConfig.relatedCharts || []

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
              case 'replication-queue-count':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartReplicationQueueCount
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'replication-summary-table':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartReplicationSummaryTable
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
          title="Table Replicas"
          description={replicasConfig.description}
          queryConfig={replicasConfig}
        />
      </Suspense>
    </div>
  )
}
