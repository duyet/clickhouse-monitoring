'use client'

import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface MetricCardProps<TData = unknown> {
  /** SWR-like response from useChartData hook */
  swr: {
    data?: TData[] | TData | Record<string, unknown> | unknown
    error?: Error | null
    isLoading?: boolean
    mutate?: () => void
    refresh?: () => void
    sql?: string
  }
  /** Card title */
  title: string
  /** Card description (subtitle) */
  description?: string
  /** Link href for "View all" action */
  viewAllHref?: string
  /** Link label (default: "View all →") */
  viewAllLabel?: string
  /** Container className */
  className?: string
  /** Children render function receives data and sql */
  children: (data: TData[]) => React.ReactNode
}

/**
 * MetricCard - Compact card for overview metrics with built-in loading/error states
 *
 * Designed for the overview page with compact layout that shows:
 * - Title and description in header
 * - Loading skeleton while fetching
 * - Error state with retry button
 * - Empty state when no data
 * - Custom content area for metric display
 *
 * @example
 * ```tsx
 * export function RunningQueries({ hostId }: { hostId: number }) {
 *   const swr = useChartData<{ count: number }>({
 *     chartName: 'running-queries-count',
 *     hostId,
 *     refreshInterval: 30000,
 *   })
 *
 *   return (
 *     <MetricCard
 *       swr={swr}
 *       title="Running Queries"
 *       description="Active"
 *       viewAllHref={`/running-queries?host=${hostId}`}
 *     >
 *       {(data) => (
 *         <div className="font-mono text-3xl font-semibold tabular-nums">
 *           {data[0].count}
 *         </div>
 *       )}
 *     </MetricCard>
 *   )
 * }
 * ```
 */
export function MetricCard<TData = unknown>({
  swr,
  title,
  description,
  viewAllHref,
  viewAllLabel = 'View all →',
  className,
  children,
}: MetricCardProps<TData>) {
  const { data, isLoading, error, mutate, refresh } = swr
  const retry = mutate || refresh || (() => {})

  // Ensure data is always an array or undefined
  const dataArray = Array.isArray(data) ? data : data ? ([data] as TData[]) : undefined

  // Loading state
  if (isLoading) {
    return <MetricCardSkeleton title={title} description={description} className={className} />
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('rounded-md', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="text-destructive mt-0.5 h-4 w-4 flex-none" />
              <div className="flex-1">
                <div className="text-destructive text-xs font-medium">Error loading data</div>
                <div className="text-muted-foreground mt-1 text-xs">{error.message}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => retry()}
              className="mt-2 h-7 text-xs"
            >
              <RefreshCwIcon className="h-3 w-3" /> Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!dataArray || dataArray.length === 0) {
    return (
      <Card className={cn('rounded-md', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">No data available</div>
        </CardContent>
      </Card>
    )
  }

  // Render metric with data
  return (
    <Card className={cn('rounded-md', className)}>
      <CardHeader className="px-4 pb-1 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          {viewAllHref && (
            <a
              className="text-muted-foreground hover:text-foreground text-sm"
              href={viewAllHref}
            >
              {viewAllLabel}
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">{children(dataArray)}</CardContent>
    </Card>
  )
}

/**
 * MetricCardSkeleton - Loading state for MetricCard
 */
function MetricCardSkeleton({
  title,
  description,
  className,
}: {
  title?: string
  description?: string
  className?: string
}) {
  return (
    <Card className={cn('rounded-md', className)}>
      <CardHeader className="px-4 pb-1 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {title ? (
              <div className="text-sm font-medium">{title}</div>
            ) : (
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            )}
            {description && <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />}
          </div>
          {title && <div className="h-4 w-16 animate-pulse rounded bg-muted" />}
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  )
}
