'use client'

import type { ReactNode } from 'react'
import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { StaleError, UseChartResult } from '@/lib/swr'
import type { ChartDataPoint } from '@/types/chart-data'

import { ChartError } from './chart-error'
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
}: ChartContainerProps<TData>) {
  const { data, isLoading, error, mutate, sql, metadata, hasData, staleError } =
    swr

  // Loading state
  if (isLoading) {
    return <ChartSkeleton title={title} className={className} />
  }

  // Error state - ONLY when no previous data exists (initial load error)
  // If we have data but error occurred during revalidation, show data with stale indicator
  if (error && !hasData) {
    return <ChartError error={error} title={title} onRetry={() => mutate()} />
  }

  // Empty state - hide the chart card when no data
  if (!data || data.length === 0) {
    return null
  }

  // Pass all metadata fields dynamically
  const toolbarMetadata: CardToolbarMetadata | undefined = metadata
    ? { ...metadata }
    : undefined

  // Render chart with data (and staleError if revalidation failed)
  return (
    <FadeIn className="h-full w-full min-w-0">
      <div
        className={cn('h-full w-full min-w-0 overflow-hidden', className)}
        aria-label={title ? `${title} chart` : 'Chart'}
        role="region"
      >
        {children(data, sql, toolbarMetadata, staleError, mutate)}
      </div>
    </FadeIn>
  )
}
