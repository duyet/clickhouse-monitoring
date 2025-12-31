'use client'

import { RefreshCw } from 'lucide-react'
import { memo, useMemo } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/data-table/data-table'
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/skeletons'
import { type ApiError, ApiErrorType } from '@/lib/api/types'
import { useHostId } from '@/lib/swr/use-host'
import { useTableData } from '@/lib/swr/use-table-data'
import type { QueryConfig } from '@/types/query-config'
import { cn } from '@/lib/utils'

interface TableClientProps {
  title: string
  description?: string | React.ReactNode
  queryConfig: QueryConfig
  searchParams?: Record<string, string | number | boolean>
  className?: string
  defaultPageSize?: number
  topRightToolbarExtras?: React.ReactNode
  /** Enable client-side column text filtering */
  enableColumnFilters?: boolean
  /** Columns to enable filtering for (default: all text columns) */
  filterableColumns?: string[]
}

/**
 * Determine the appropriate variant based on error type
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
 * Get user-friendly error description
 */
function getErrorDescription(
  error: Error | ApiError,
  variant: EmptyStateVariant
): string {
  const _apiError = error as ApiError

  // Use specific messages for known error types
  if (variant === 'table-missing') {
    return "This feature requires additional ClickHouse configuration or the system table doesn't exist on this cluster."
  }

  if (variant === 'timeout') {
    return 'The query took too long to execute. Try reducing the time range or simplifying your filters.'
  }

  if (variant === 'offline') {
    return 'Unable to connect to the server. Check your network connection and try again.'
  }

  // Fall back to the actual error message if available
  if (error.message && error.message.length < 200) {
    return error.message
  }

  return 'An unexpected error occurred while loading data. Please try again.'
}

/**
 * Client-side table wrapper that handles data fetching with SWR
 * Provides loading, error, and empty states with automatic refresh capability
 *
 * @example
 * ```tsx
 * export default function QueryLogsPage() {
 *   return (
 *     <TableClient
 *       title="Query Logs"
 *       description="All queries executed on the cluster"
 *       queryConfig={queryLogsConfig}
 *     />
 *   )
 * }
 * ```
 */
export const TableClient = memo(function TableClient({
  title,
  description,
  queryConfig,
  searchParams = {},
  className,
  defaultPageSize = 100,
  topRightToolbarExtras,
  enableColumnFilters = false,
  filterableColumns,
}: TableClientProps) {
  const hostId = useHostId()

  const { data, metadata, error, isLoading, isValidating, refresh } = useTableData<
    Record<string, unknown>
  >(queryConfig.name, hostId, searchParams, 30000)

  // Show skeleton during initial load OR if validating with no existing data
  // This prevents showing "no data" while waiting for the first response
  const isInitialLoading = isLoading || (isValidating && (!data || data.length === 0))

  if (isInitialLoading) {
    return <TableSkeleton />
  }

  if (error) {
    const variant = useMemo(() => getErrorVariant(error), [error])
    const description = useMemo(
      () => getErrorDescription(error, variant),
      [error, variant]
    )

    return (
      <Card
        className={cn(
          'rounded-md',
          variant === 'error' && 'border-destructive/30 bg-destructive/5',
          variant === 'timeout' && 'border-warning/30 bg-warning/5',
          variant === 'offline' && 'border-warning/30 bg-warning/5',
          variant === 'table-missing' && 'border-warning/30 bg-warning/5',
          className
        )}
        role="alert"
        aria-label={title ? `${title} error` : 'Error loading table'}
      >
        <CardContent className="p-6">
          <EmptyState
            variant={variant}
            title={title || (variant === 'error' ? 'Failed to load' : undefined)}
            description={description}
            action={
              refresh
                ? {
                    label: 'Retry',
                    onClick: refresh,
                    icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <Card className={cn('rounded-md border-warning/30 bg-warning/5', className)}>
        <CardContent className="p-6">
          <EmptyState
            variant="no-data"
            title={title || 'No Data'}
            description="No data available for this query. Try adjusting your filters or check back later."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <DataTable
      title={title}
      description={description}
      queryConfig={queryConfig}
      queryParams={searchParams}
      data={data}
      context={{ ...searchParams, hostId: String(hostId) }}
      defaultPageSize={defaultPageSize}
      footnote={
        metadata
          ? `${metadata.rows} row(s) in ${metadata.duration?.toFixed(2)}s`
          : undefined
      }
      className={className}
      topRightToolbarExtras={topRightToolbarExtras}
      enableColumnFilters={enableColumnFilters}
      filterableColumns={filterableColumns}
      isRefreshing={isValidating}
    />
  )
})
