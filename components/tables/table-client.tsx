'use client'

import { RefreshCw } from 'lucide-react'

import type { QueryConfig } from '@/types/query-config'

import { memo } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/skeletons'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { OptionalTableInfo } from '@/components/feedback/optional-table-info'
import {
  type CardError,
  detectCardErrorVariant,
  getCardErrorClassName,
  getCardErrorDescription,
  getCardErrorTitle,
  getTableMissingInfo,
  shouldShowRetryButton,
} from '@/lib/card-error-utils'
import { useHostId } from '@/lib/swr/use-host'
import { useTableData } from '@/lib/swr/use-table-data'
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
  /** Enable row selection with checkboxes */
  enableRowSelection?: boolean
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
  enableRowSelection = false,
}: TableClientProps) {
  const hostId = useHostId()

  const { data, metadata, error, isLoading, isValidating, refresh } =
    useTableData<Record<string, unknown>>(
      queryConfig.name,
      hostId,
      searchParams,
      30000
    )

  // Show skeleton during initial load OR if validating with no existing data
  // This prevents showing "no data" while waiting for the first response
  const isInitialLoading =
    isLoading || (isValidating && (!data || data.length === 0))

  if (isInitialLoading) {
    return <TableSkeleton />
  }

  if (error) {
    const variant = detectCardErrorVariant(error as CardError)
    const showRetry = shouldShowRetryButton(error as CardError)

    // Get table-specific guidance for table-missing errors
    const tableMissingInfo = getTableMissingInfo(error as CardError)
    const guidance = tableMissingInfo?.guidance

    // For table-missing errors without specific guidance, show a helpful card
    if (variant === 'table-missing') {
      const errorTitle = getCardErrorTitle(variant, title)
      const errorDescription = getCardErrorDescription(
        error as CardError,
        variant
      )

      return (
        <Card
          className={cn(
            'rounded-md border-blue-200/50 bg-blue-50/30 dark:border-blue-900/30 dark:bg-blue-950/20 shadow-none',
            className
          )}
          role="alert"
          aria-label={title ? `${title} unavailable` : 'Table not available'}
        >
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-2">
                  {errorTitle}
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="leading-relaxed">{errorDescription}</p>
                  <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50">
                    <p className="text-xs">
                      This feature requires additional ClickHouse configuration.{' '}
                      <a
                        href="https://clickhouse.com/docs/en/operations/system-tables"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        View ClickHouse documentation
                        <svg
                          className="h-3 w-3 inline"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </p>
                  </div>
                </div>
                {showRetry && (
                  <div className="mt-3">
                    <button
                      onClick={() => refresh()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-blue-300/50 rounded-md hover:bg-blue-100/50 dark:border-blue-700/50 dark:hover:bg-blue-900/30 transition-colors text-blue-700 dark:text-blue-300"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Fall back to generic error handling for other error types
    const errorTitle = getCardErrorTitle(variant, title)
    const errorClassName = getCardErrorClassName(variant)
    const errorDescription = getCardErrorDescription(
      error as CardError,
      variant
    )

    return (
      <Card
        className={cn('rounded-md shadow-none py-2', errorClassName, className)}
        role="alert"
        aria-label={title ? `${title} error` : 'Error loading table'}
      >
        <CardContent className="p-4">
          <EmptyState
            variant={variant}
            title={errorTitle}
            description={errorDescription}
            compact={true}
            action={
              showRetry
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
      <Card
        className={cn(
          'rounded-md border-warning/30 bg-warning/5 shadow-none py-2',
          className
        )}
      >
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
      enableRowSelection={enableRowSelection}
    />
  )
})
