'use client'

import { ExternalLink, RefreshCw } from 'lucide-react'

import type { QueryConfig } from '@/types/query-config'

import { memo } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/skeletons'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
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
    const errorTitle = getCardErrorTitle(variant, title)
    const errorClassName = getCardErrorClassName(variant)
    const showRetry = shouldShowRetryButton(error as CardError)

    // Get table-specific guidance for table-missing errors
    const tableMissingInfo = getTableMissingInfo(error as CardError)
    const guidance = tableMissingInfo?.guidance

    // Build description with guidance and docs link
    let errorDescription: React.ReactNode = getCardErrorDescription(
      error as CardError,
      variant
    )

    if (guidance) {
      errorDescription = (
        <div className="space-y-2">
          <p>{guidance.enableInstructions}</p>
          {guidance.docsUrl && (
            <a
              href={guidance.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View ClickHouse documentation
            </a>
          )}
        </div>
      )
    }

    return (
      <Card
        className={cn('rounded-md shadow-none py-2', errorClassName, className)}
        role="alert"
        aria-label={title ? `${title} error` : 'Error loading table'}
      >
        <CardContent className="p-6">
          <EmptyState
            variant={variant}
            title={errorTitle}
            description={errorDescription}
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
