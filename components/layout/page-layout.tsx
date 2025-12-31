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

import { memo, type ReactNode, Suspense } from 'react'
import { getChartComponent } from '@/components/charts/chart-registry'
import { ChartSkeleton } from '@/components/skeletons'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { FadeIn } from '@/components/ui/fade-in'
import { useHostId } from '@/lib/swr'
import type { QueryConfig } from '@/types/query-config'

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
  /** Additional search params to pass to table */
  searchParams?: Record<string, string | number | boolean>
}

/**
 * Options for creating a standardized page from a QueryConfig
 */
export interface CreatePageOptions {
  queryConfig: QueryConfig
  title?: string
  description?: string
  headerContent?: ReactNode
  footerContent?: ReactNode
  chartsGridClass?: string
  hideTable?: boolean
  searchParams?: Record<string, string | number | boolean>
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
    <div className="flex min-h-[180px] flex-col">
      <FadeIn duration={250} className="flex flex-1 flex-col">
        <ChartComponent
          className="w-full p-0 shadow-none"
          chartClassName="h-full min-h-[180px]"
          hostId={hostId}
          {...chartProps}
        />
      </FadeIn>
    </div>
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
  gridClass = 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
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
          return <div key={`break-${index}`} className="xl:col-span-4" />
        }

        // Extract chart name and props
        const chartName = Array.isArray(chartConfig)
          ? chartConfig[0]
          : chartConfig
        const chartProps = Array.isArray(chartConfig)
          ? chartConfig[1] || {}
          : {}

        return (
          <div key={`${chartName}-${index}`}>
            <Suspense fallback={<ChartSkeleton />}>
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
  searchParams,
}: PageLayoutProps) {
  const hostId = useHostId()
  const relatedCharts = queryConfig.relatedCharts || []

  return (
    <div className="flex flex-1 flex-col gap-4">
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
          <FadeIn duration={300} className="flex flex-1 flex-col">
            <TableClient
              title={title || queryConfig.name}
              description={description || queryConfig.description}
              queryConfig={queryConfig}
              searchParams={searchParams}
              className="flex flex-1 flex-col"
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
 * export default createPage({
 *   queryConfig: mergesConfig,
 *   title: 'Merges',
 * })
 * ```
 */
export function createPage(options: CreatePageOptions) {
  return memo(function Page() {
    return <PageLayout {...options} />
  })
}
