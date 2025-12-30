/**
 * Generic Page Layout Component
 *
 * Eliminates duplication across 30+ page files by providing:
 * - Dynamic chart rendering from registry
 * - Responsive grid layout
 * - Automatic suspense boundaries
 * - Smooth skeleton-to-content transitions
 * - Table integration
 */

'use client'

import { Suspense, memo, type ReactNode } from 'react'
import type { QueryConfig } from '@/types/query-config'
import { ChartSkeleton } from '@/components/charts/chart-skeleton'
import { TableSkeleton } from '@/components/skeleton'
import { TableClient } from '@/components/table-client'
import { useHostId } from '@/lib/swr'
import { FadeIn } from '@/components/ui/fade-in'
import {
  getChartComponent,
  getChartSkeletonType,
  type ChartProps,
} from '@/components/charts/chart-registry'

export interface PageLayoutProps {
  /** Query config for the page table */
  queryConfig: QueryConfig
  /** Title for the table (defaults to queryConfig.name) */
  title?: string
  /** Description for the table (defaults to queryConfig.description) */
  description?: string
  /** Additional content to render above charts */
  headerContent?: ReactNode
  /** Additional content to render after table */
  footerContent?: ReactNode
  /** Custom grid class for charts */
  chartsGridClass?: string
  /** Whether to hide the table */
  hideTable?: boolean
}

/**
 * Dynamic Chart Renderer
 *
 * Renders a chart by name from the registry with automatic lazy loading
 */
interface DynamicChartProps {
  chartName: string
  hostId: number
  chartProps?: Record<string, unknown>
}

const DynamicChart = memo(function DynamicChart({
  chartName,
  hostId,
  chartProps = {},
}: DynamicChartProps) {
  const ChartComponent = getChartComponent(chartName)

  if (!ChartComponent) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground text-sm">
          Unknown chart: {chartName}
        </p>
      </div>
    )
  }

  return (
    <FadeIn duration={250}>
      <ChartComponent
        className="w-full p-0 shadow-none"
        chartClassName="h-32 sm:h-36"
        hostId={hostId}
        {...chartProps}
      />
    </FadeIn>
  )
})

/**
 * Related Charts Grid
 *
 * Renders a grid of charts based on queryConfig.relatedCharts
 */
interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  hostId: number
  gridClass?: string
}

const RelatedCharts = memo(function RelatedCharts({
  relatedCharts,
  hostId,
  gridClass = 'grid grid-cols-1 gap-5 md:grid-cols-2',
}: RelatedChartsProps) {
  if (!relatedCharts || relatedCharts.length === 0) {
    return null
  }

  return (
    <div className={gridClass}>
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

        // Calculate column span for responsive layout
        const isLastChart = index === relatedCharts.length - 1
        const colSpan =
          isLastChart && index % 2 === 1 ? 'md:col-span-2' : ''

        return (
          <div key={`${chartName}-${index}`} className={colSpan}>
            <Suspense
              fallback={
                <ChartSkeleton
                  type={getChartSkeletonType(chartName)}
                  dataPoints={8}
                />
              }
            >
              <DynamicChart
                chartName={chartName}
                hostId={hostId}
                chartProps={chartProps}
              />
            </Suspense>
          </div>
        )
      })}
    </div>
  )
})

/**
 * Generic Page Layout
 *
 * Provides a consistent layout for all pages with:
 * - Optional header content
 * - Related charts grid
 * - Data table
 * - Optional footer content
 */
export const PageLayout = memo(function PageLayout({
  queryConfig,
  title,
  description,
  headerContent,
  footerContent,
  chartsGridClass,
  hideTable = false,
}: PageLayoutProps) {
  const hostId = useHostId()
  const relatedCharts = queryConfig.relatedCharts || []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Optional Header Content */}
      {headerContent}

      {/* Related Charts */}
      <RelatedCharts
        relatedCharts={relatedCharts}
        hostId={hostId}
        gridClass={chartsGridClass}
      />

      {/* Data Table - flex-1 to fill remaining space */}
      {!hideTable && (
        <Suspense fallback={<TableSkeleton />}>
          <FadeIn duration={300} className="flex min-h-0 flex-1 flex-col">
            <TableClient
              title={title || queryConfig.name}
              description={description || queryConfig.description}
              queryConfig={queryConfig}
              className="flex min-h-0 flex-1 flex-col"
            />
          </FadeIn>
        </Suspense>
      )}

      {/* Optional Footer Content */}
      {footerContent}
    </div>
  )
})

/**
 * HOC for creating a page from a QueryConfig
 *
 * Usage:
 * ```tsx
 * export default createPage(mergesConfig)
 * ```
 */
export function createPage(config: QueryConfig, options?: Partial<PageLayoutProps>) {
  return function Page() {
    return <PageLayout queryConfig={config} {...options} />
  }
}
