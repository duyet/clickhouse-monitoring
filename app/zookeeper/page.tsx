'use client'

import { Suspense, lazy } from 'react'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { useHostId } from '@/lib/swr'
import { zookeeperConfig } from '@/lib/query-config/more/zookeeper'

// Lazy load chart components for code splitting
const ChartZookeeperRequests = lazy(() =>
  import('@/components/charts/zookeeper-requests').then((m) => ({
    default: m.default,
  }))
)
const ChartZookeeperWait = lazy(() =>
  import('@/components/charts/zookeeper-wait').then((m) => ({
    default: m.default,
  }))
)
const ChartZookeeperUptime = lazy(() =>
  import('@/components/charts/zookeeper-uptime').then((m) => ({
    default: m.default,
  }))
)
const ChartZookeeperSummaryTable = lazy(() =>
  import('@/components/charts/zookeeper-summary-table').then((m) => ({
    default: m.default,
  }))
)
const ChartZookeeperException = lazy(() =>
  import('@/components/charts/zookeeper-exception').then((m) => ({
    default: m.default,
  }))
)

export default function ZookeeperPage() {
  const hostId = useHostId()
  const relatedCharts = zookeeperConfig.relatedCharts || []

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
              case 'zookeeper-requests':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartZookeeperRequests
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'zookeeper-wait':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartZookeeperWait
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'zookeeper-uptime':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartZookeeperUptime
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'zookeeper-summary-table':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartZookeeperSummaryTable
                      className="w-full p-0 shadow-none"
                      chartClassName="h-44"
                      hostId={hostId}
                      {...chartProps}
                    />
                  </Suspense>
                )
              case 'zookeeper-exception':
                return (
                  <Suspense fallback={<ChartSkeleton />}>
                    <ChartZookeeperException
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
          title="ZooKeeper"
          description={zookeeperConfig.description}
          queryConfig={zookeeperConfig}
        />
      </Suspense>
    </div>
  )
}
