'use client'

import { memo, type ReactNode, useMemo } from 'react'
import type { SWRResponse } from 'swr'
import { ChartEmpty } from './chart-empty'
import { ChartError } from './chart-error'
import { ChartSkeleton } from '@/components/skeletons'

export interface ChartContainerProps<TData = unknown> {
  /** SWR response from useChartData hook */
  swr: SWRResponse<TData, Error> & { sql?: string }
  /** Chart title for skeleton/error/empty states */
  title?: string
  /** Container className */
  className?: string
  /** Chart className */
  chartClassName?: string
  /** Children render function receives data and sql */
  children: (data: TData[], sql: string | undefined) => ReactNode
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
 *       {(data, sql) => (
 *         <ChartCard title={title} sql={sql} data={data}>
 *           <AreaChart data={data} index="time" categories={['value']} />
 *         </ChartCard>
 *       )}
 *     </ChartContainer>
 *   )
 * }
 * ```
 */
export const ChartContainer = memo(function ChartContainer<TData = unknown>({
  swr,
  title,
  className,
  chartClassName,
  children,
}: ChartContainerProps<TData>) {
  const { data, isLoading, error, mutate, sql } = swr

  // Ensure data is always an array or undefined
  const dataArray = useMemo(() => {
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') return [data] as TData[]
    return undefined
  }, [data])

  // Loading state
  if (isLoading) {
    return (
      <ChartSkeleton
        title={title}
        className={className}
        chartClassName={chartClassName}
      />
    )
  }

  // Error state
  if (error) {
    return <ChartError error={error} title={title} onRetry={() => mutate()} />
  }

  // Empty state
  if (!dataArray || dataArray.length === 0) {
    return <ChartEmpty title={title} className={className} />
  }

  // Render chart with data
  return (
    <div aria-label={title ? `${title} chart` : 'Chart'} role="region">
      {children(dataArray, sql)}
    </div>
  )
})
