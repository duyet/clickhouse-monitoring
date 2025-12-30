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

  const cardClassName = cn(
    'rounded-md border-border/50 bg-card/50 backdrop-blur-sm',
    'shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
    'transition-all duration-200 hover:border-border/80 hover:shadow-[0_2px_8px_0_rgb(0_0_0/0.04)]',
    '!gap-1 !py-2', // Compact spacing override
    className
  )

  // Loading state
  if (isLoading) {
    return <MetricCardSkeleton title={title} description={description} className={className} />
  }

  // Error state
  if (error) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="px-3 pb-0 pt-2">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">{title}</CardTitle>
          {description && <CardDescription className="text-[10px]">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="px-3 pt-1.5 pb-2.5">
          <div className="rounded border border-destructive/20 bg-destructive/5 p-1.5">
            <div className="flex items-start gap-1.5">
              <AlertCircleIcon className="text-destructive mt-0.5 h-3 w-3 flex-none" />
              <div className="flex-1 min-w-0">
                <div className="text-destructive text-[10px] font-medium">Error</div>
                <div className="text-muted-foreground text-[10px] truncate">{error.message}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => retry()}
              className="mt-1 h-5 text-[10px] px-2"
            >
              <RefreshCwIcon className="h-2.5 w-2.5" /> Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!dataArray || dataArray.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="px-3 pb-0 pt-2">
          <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">{title}</CardTitle>
          {description && <CardDescription className="text-[10px]">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="px-3 pt-1.5 pb-2.5">
          <div className="text-muted-foreground text-[10px]">No data</div>
        </CardContent>
      </Card>
    )
  }

  // Render metric with data
  return (
    <Card className={cardClassName}>
      <CardHeader className="px-3 pb-0 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">{title}</CardTitle>
            {description && <CardDescription className="text-[10px]">{description}</CardDescription>}
          </div>
          {viewAllHref && (
            <a
              className="text-muted-foreground/60 hover:text-foreground text-[10px] whitespace-nowrap transition-colors"
              href={viewAllHref}
            >
              {viewAllLabel}
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pt-1.5 pb-2.5">{children(dataArray)}</CardContent>
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
    <Card className={cn(
      'rounded-md border-border/50 bg-card/50',
      'shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]',
      '!gap-1 !py-2', // Compact spacing override
      className
    )}>
      <CardHeader className="px-3 pb-0 pt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {title ? (
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">{title}</div>
            ) : (
              <div className="h-2.5 w-16 animate-shimmer rounded bg-accent/50" />
            )}
            {description && <div className="mt-0.5 h-2 w-10 animate-shimmer rounded bg-accent/50" />}
          </div>
          {title && <div className="h-2 w-10 animate-shimmer rounded bg-accent/50" />}
        </div>
      </CardHeader>
      <CardContent className="px-3 pt-1.5 pb-2.5">
        <div className="h-5 w-12 animate-shimmer rounded bg-accent/50" />
      </CardContent>
    </Card>
  )
}
