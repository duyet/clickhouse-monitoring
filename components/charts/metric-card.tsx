'use client'

import { RefreshCwIcon } from 'lucide-react'
import { useMemo } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { ApiErrorType, type ApiError } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Determine the appropriate error variant based on error type and message
 */
function getErrorVariant(error: Error | ApiError): EmptyStateVariant {
  const apiError = error as ApiError
  const message = error.message?.toLowerCase() ?? ''

  // Check for table not found
  if (apiError.type === ApiErrorType.TableNotFound) return 'table-missing'

  // Check for network/connection errors
  if (apiError.type === ApiErrorType.NetworkError) return 'offline'
  if (
    message.includes('offline') ||
    message.includes('network') ||
    message.includes('fetch')
  )
    return 'offline'

  // Check for timeout in message
  if (message.includes('timeout') || message.includes('timed out'))
    return 'timeout'

  return 'error'
}

/**
 * Get user-friendly error description based on variant
 */
function getErrorDescription(
  error: Error | ApiError,
  variant: EmptyStateVariant
): string {
  if (variant === 'offline') {
    return 'Unable to connect to the server. Check your network connection and try again.'
  }

  if (variant === 'timeout') {
    return 'The query took too long to execute. Try reducing the time range or simplifying your filters.'
  }

  // Fall back to the actual error message if it's short enough
  if (error.message && error.message.length < 200) {
    return error.message
  }

  return 'An unexpected error occurred while loading data. Please try again.'
}

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
 * MetricCard - Card for overview metrics with built-in loading/error states
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
  const dataArray = Array.isArray(data)
    ? data
    : data
      ? ([data] as TData[])
      : undefined

  const cardClassName = cn(
    'relative overflow-hidden rounded-lg border border-border/40',
    'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm',
    'shadow-sm transition-colors duration-200',
    'hover:border-border/60',
    className
  )

  // Loading state
  if (isLoading) {
    return (
      <MetricCardSkeleton
        title={title}
        description={description}
        className={className}
      />
    )
  }

  // Error state
  if (error) {
    const variant = getErrorVariant(error)
    const description = getErrorDescription(error, variant)

    return (
      <Card
        className={cn(
          cardClassName,
          variant === 'error' && 'border-destructive/30 bg-destructive/5',
          variant === 'timeout' && 'border-warning/30 bg-warning/5',
          variant === 'offline' && 'border-warning/30 bg-warning/5'
        )}
        role="alert"
        aria-label={`Error loading ${title}`}
      >
        <CardHeader className="px-4 pb-1 pt-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground/70">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <EmptyState
            variant={variant}
            title={variant === 'error' ? 'Failed to load' : undefined}
            description={description}
            compact
            action={{
              label: 'Retry',
              onClick: retry,
              icon: <RefreshCwIcon className="mr-1.5 size-3.5" />,
            }}
          />
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!dataArray || dataArray.length === 0) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="px-4 pb-1 pt-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground/70">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="text-2xl font-bold tabular-nums text-muted-foreground/50">
            —
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render metric with data
  return (
    <Card className={cardClassName}>
      <CardHeader className="px-4 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs text-muted-foreground/70">
                {description}
              </CardDescription>
            )}
          </div>
          {viewAllHref && (
            <a
              className="shrink-0 text-xs text-muted-foreground/50 transition-colors hover:text-primary"
              href={viewAllHref}
            >
              {viewAllLabel}
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        {children(dataArray)}
      </CardContent>
    </Card>
  )
}

/**
 * MetricCardSkeleton - Polished loading state with smooth pulse animation
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
    <Card
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/40',
        'bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm',
        'shadow-sm',
        className
      )}
      role="status"
      aria-label={`Loading ${title || 'metric'}`}
    >
      <CardHeader className="px-4 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            {title ? (
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </CardTitle>
            ) : (
              <Skeleton className="h-3 w-20" />
            )}
            {description ? (
              <CardDescription className="text-xs text-muted-foreground/70">
                {description}
              </CardDescription>
            ) : (
              <Skeleton className="h-2.5 w-14" />
            )}
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <Skeleton className="h-8 w-16" />
      </CardContent>
      <span className="sr-only">Loading {title || 'metric'} data...</span>
    </Card>
  )
}
