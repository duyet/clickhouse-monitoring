/**
 * Generic Page Layout Component
 *
 * Eliminates duplication across 30+ page files by providing:
 * - Dynamic chart rendering from registry
 * - Responsive grid layout
 * - Automatic suspense boundaries
 * - Smooth skeleton-to-content transitions
 * - Table integration
 * - Collapsible chart section with localStorage persistence
 */

'use client'

import { memo, type ReactNode, Suspense, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { getChartComponent } from '@/components/charts/chart-registry'
import { ChartSkeleton } from '@/components/skeletons'
import { TableSkeleton } from '@/components/skeletons'
import { TableClient } from '@/components/tables/table-client'
import { FadeIn } from '@/components/ui/fade-in'
import { Button } from '@/components/ui/button'
import { useHostId } from '@/lib/swr'
import type { QueryConfig } from '@/types/query-config'

// ============================================================================
// Local Storage Hook for Charts Collapsed State
// ============================================================================

const CHARTS_COLLAPSED_KEY = 'clickhouse-monitor-charts-collapsed'

function useChartsCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CHARTS_COLLAPSED_KEY)
      return stored === 'true'
    }
    return false
  })

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHARTS_COLLAPSED_KEY, String(newValue))
      }
      return newValue
    })
  }

  return { isCollapsed, toggleCollapsed }
}

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
 * - More relaxed responsive: 1 → 2 → 3 (until 1280px) → 4 (at 1536px+)
 * - Equal card heights with h-full
 */
interface RelatedChartsProps {
  relatedCharts: QueryConfig['relatedCharts']
  hostId: number
  gridClass?: string
}

const RelatedCharts = memo(function RelatedCharts({
  relatedCharts,
  hostId,
  gridClass = 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
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
          return <div key={`break-${index}`} className="2xl:col-span-4" />
        }

        // Extract chart name and props
        const chartName = Array.isArray(chartConfig)
          ? chartConfig[0]
          : chartConfig
        const chartProps = Array.isArray(chartConfig)
          ? chartConfig[1] || {}
          : {}

        return (
          <div key={`${chartName}-${index}`} className="h-full">
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
 * - Collapsible related charts grid (with localStorage persistence)
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
  const { isCollapsed, toggleCollapsed } = useChartsCollapsed()
  const hasCharts = relatedCharts.length > 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Optional Header Content */}
      {headerContent}

      {/* Charts Section with Collapse Toggle */}
      {hasCharts && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="h-7 gap-1 px-2 text-xs"
              aria-label={isCollapsed ? 'Show charts' : 'Hide charts'}
            >
              {isCollapsed ? (
                <>
                  <span>Show Charts</span>
                  <ChevronDownIcon className="size-3.5" />
                </>
              ) : (
                <>
                  <span>Hide Charts</span>
                  <ChevronUpIcon className="size-3.5" />
                </>
              )}
            </Button>
          </div>
          {!isCollapsed && (
            <FadeIn duration={200} className="overflow-hidden">
              <RelatedCharts
                relatedCharts={relatedCharts}
                hostId={hostId}
                gridClass={chartsGridClass}
              />
            </FadeIn>
          )}
        </div>
      )}

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
