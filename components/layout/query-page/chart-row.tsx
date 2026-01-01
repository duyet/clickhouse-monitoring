/**
 * ChartRow Component
 *
 * Renders a collapsible row of charts with inline chevron toggle.
 *
 * Features:
 * - Inline chevron toggle (▶/▼) with smooth rotation animation
 * - Responsive grid layout (1→2→4 columns) when expanded
 * - Collapsed state shows "Row N (X charts)" label
 * - Uses Radix Collapsible for smooth animations
 * - Equal height cards via auto-rows-fr grid
 */

'use client'

import { memo, Suspense } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChartSkeleton } from '@/components/skeletons'
import { cn } from '@/lib/utils'
import type { QueryConfig } from '@/types/query-config'
import { DynamicChart } from './dynamic-chart'

type ChartConfig = NonNullable<QueryConfig['relatedCharts']>[number]

/** Check if any chart in the list has a colSpan defined */
function hasColSpan(charts: ChartConfig[]): boolean {
  return charts.some((c) => {
    if (!c || c === 'break') return false
    const props = Array.isArray(c) ? c[1] : undefined
    return props && typeof props === 'object' && 'colSpan' in props
  })
}

export interface ChartRowProps {
  rowIndex: number
  charts: ChartConfig[]
  hostId: number
  isCollapsed: boolean
  onToggle: () => void
}

export const ChartRow = memo(function ChartRow({
  rowIndex,
  charts,
  hostId,
  isCollapsed,
  onToggle,
}: ChartRowProps) {
  // Filter out 'break' directives for counting
  const chartCount = charts.filter((c) => c && c !== 'break').length

  if (chartCount === 0) {
    return null
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggle}>
      <div className="group relative">
        {/* Collapsed state - clickable titles to expand */}
        {isCollapsed && (
          <CollapsibleTrigger asChild>
            <div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer px-4">
              <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-sm truncate">
                {charts
                  .filter((c) => c && c !== 'break')
                  .map((c) => {
                    const props = Array.isArray(c) ? c[1] : undefined
                    const name = Array.isArray(c) ? c[0] : c
                    return props?.title || name.replace(/-/g, ' ')
                  })
                  .join(' · ')}
              </span>
            </div>
          </CollapsibleTrigger>
        )}

        {/* Expanded state - hover-reveal hide button */}
        {!isCollapsed && (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'absolute z-50 h-6 px-3 gap-1',
                'left-1/2 -translate-x-1/2 -bottom-3',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                'bg-muted hover:bg-muted/80 text-muted-foreground',
                'rounded-full text-xs'
              )}
              aria-label="Collapse row"
            >
              <ChevronUpIcon className="h-3 w-3" />
              <span>Hide row</span>
            </Button>
          </CollapsibleTrigger>
        )}

        {/* Expanded state - charts grid */}
        <CollapsibleContent>
          <div
            className={cn(
              'grid gap-3 items-stretch',
              // Use 10-column grid when colSpan is used, otherwise 2-column
              hasColSpan(charts)
                ? 'grid-cols-1 md:grid-cols-10 auto-rows-[1fr]'
                : 'grid-cols-1 md:grid-cols-2 auto-rows-fr'
            )}
          >
            {charts.map((chartConfig, index) => {
              if (!chartConfig) return null

              // Handle break directive
              if (
                typeof chartConfig === 'string' &&
                chartConfig === 'break'
              ) {
                return <div key={`break-${index}`} className="hidden" />
              }

              // Extract chart name and props
              const chartName = Array.isArray(chartConfig)
                ? chartConfig[0]
                : chartConfig
              const chartProps = Array.isArray(chartConfig)
                ? chartConfig[1] || {}
                : {}

              // Get colSpan from props (default to full width on mobile, half on desktop)
              const colSpan = (chartProps as { colSpan?: number }).colSpan

              return (
                <div
                  key={`${chartName}-${index}`}
                  className={cn(
                    'h-full',
                    colSpan && `md:col-span-${colSpan}`
                  )}
                  style={colSpan ? { gridColumn: `span ${colSpan} / span ${colSpan}` } : undefined}
                >
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
})
