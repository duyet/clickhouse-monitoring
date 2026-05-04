'use client'

import type { ReactNode } from 'react'
import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { DateRangeConfig, DateRangeValue } from '@/components/date-range'
import type { StaleError, UseChartResult } from '@/lib/swr'
import type { ChartDataPoint } from '@/types/chart-data'

import { ChartEmpty } from './chart-empty'
import { ChartError } from './chart-error'
import { ChartZoomButton, ChartZoomDialog } from './chart-zoom-dialog'
import { cloneElement, isValidElement, useMemo, useState } from 'react'
import { ChartSkeleton } from '@/components/skeletons'
import { FadeIn } from '@/components/ui/fade-in'
import { cn } from '@/lib/utils'

export interface ChartContainerProps<
  TData extends ChartDataPoint = ChartDataPoint,
> {
  /** SWR response from useChartData hook */
  swr: UseChartResult<TData>
  /** Chart title for skeleton/error/empty states */
  title?: string
  /** Container className */
  className?: string
  /** Chart className */
  chartClassName?: string
  /**
   * Children render function receives data, sql, metadata, staleError, and mutate
   * staleError is set when revalidation fails but previous data exists
   */
  children: (
    data: TData[],
    sql: string | undefined,
    metadata: CardToolbarMetadata | undefined,
    staleError: StaleError | undefined,
    mutate: () => Promise<unknown>
  ) => ReactNode
  /** Use compact layout for smaller charts */
  compact?: boolean
  /** Enable zoom dialog (default: true) */
  enableZoom?: boolean
  /** Date range configuration for zoom dialog */
  dateRangeConfig?: DateRangeConfig
  /** Current selected range value */
  currentRange?: string
  /** Callback when date range changes */
  onRangeChange?: (range: DateRangeValue) => void
}

/**
 * ChartContainer - Unified chart loading state handler
 *
 * Eliminates duplicate loading/error/empty state handling across 32+ chart components.
 *
 * @example
 * ```tsx
 * export function MyChart({ hostId, title }: ChartProps) {
 *   const swr = useChartData<{ value: number }>({
 *     chartName: 'my-chart',
 *     hostId,
 *   })
 *
 *   return (
 *     <ChartContainer swr={swr} title={title} className="w-full">
 *       {(data, sql, metadata) => (
 *         <ChartCard title={title} sql={sql} data={data} metadata={metadata}>
 *           <AreaChart data={data} index="time" categories={['value']} />
 *         </ChartCard>
 *       )}
 *     </ChartContainer>
 *   )
 * }
 * ```
 */
export function ChartContainer<TData extends ChartDataPoint = ChartDataPoint>({
  swr,
  title,
  className,
  chartClassName: _chartClassName,
  children,
  compact: _compact = false,
  enableZoom = true,
  dateRangeConfig,
  currentRange,
  onRangeChange,
}: ChartContainerProps<TData>) {
  const { data, isLoading, error, mutate, sql, metadata, hasData, staleError } =
    swr
  const [zoomOpen, setZoomOpen] = useState(false)

  // Pass all metadata fields dynamically
  const toolbarMetadata: CardToolbarMetadata | undefined = metadata
    ? { ...metadata }
    : undefined

  // Render chart content memoize callback to avoid cloneElement on every render
  const chartContent = useMemo(
    () => children(data ?? [], sql, toolbarMetadata, staleError, mutate),
    [data, sql, toolbarMetadata, staleError, mutate, children]
  )

  // Loading state
  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  // Error state - ONLY when no previous data exists (initial load error)
  // If we have data but error occurred during revalidation, show data with stale indicator
  if (error && !hasData) {
    return <ChartError error={error} title={title} onRetry={() => mutate()} />
  }

  // Empty state - show empty state message instead of hiding
  if (!data || data.length === 0) {
    return (
      <ChartEmpty
        title={title}
        className={className}
        compact={_compact}
        sql={sql}
        metadata={metadata}
      />
    )
  }

  // If children returns a valid element, inject zoomButton prop if it's a ChartCard
  const enhancedContent =
    enableZoom &&
    isValidElement(chartContent) &&
    (chartContent.props as Record<string, unknown>).zoomButton === undefined
      ? cloneElement(chartContent, {
          zoomButton: <ChartZoomButton onClick={() => setZoomOpen(true)} />,
        } as Record<string, unknown>)
      : chartContent

  return (
    <>
      <FadeIn className="h-full w-full min-w-0">
        <div
          className={cn('h-full w-full min-w-0 overflow-hidden', className)}
          aria-label={title ? `${title} chart` : 'Chart'}
          role="region"
        >
          {enhancedContent}
        </div>
      </FadeIn>
      {enableZoom && zoomOpen && (
        <ChartZoomDialog
          open={zoomOpen}
          onOpenChange={setZoomOpen}
          title={title}
          sql={sql}
          data={data}
          metadata={toolbarMetadata}
          dateRangeConfig={dateRangeConfig}
          currentRange={currentRange}
          onRangeChange={onRangeChange}
          staleError={staleError}
          onRetry={staleError ? mutate : undefined}
          className={_chartClassName}
        >
          {enhancedContent}
        </ChartZoomDialog>
      )}
    </>
  )
}
