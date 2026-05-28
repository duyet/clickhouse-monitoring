'use client'

import { Info, RefreshCw } from 'lucide-react'

import type { ApiResponseMetadata } from '@/lib/api/types'
import type { QueryConfig } from '@/types/query-config'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { DataTable } from '@/components/data-table/data-table'
import { TableSkeleton } from '@/components/skeletons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SuggestionCard } from '@/components/ui/suggestion-card'
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
import { getSqlForDisplay } from '@/types/query-config'

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
  /**
   * Render the schema-driven filter bar above the table when the
   * QueryConfig declares a filterSchema (default: true). Set to false
   * when the surrounding page already renders its own FilterBar to avoid
   * a duplicated control wired to the same URL state.
   */
  showFilterBar?: boolean
}

const tableRowFormatter = new Intl.NumberFormat('en-US')

function GuidanceMarkdown({ content }: { content: string }) {
  return (
    <div className="text-foreground/80 leading-relaxed [&>p]:my-0 [&>p+p]:mt-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          code: ({ className, children, ...props }) => {
            const isInline = !className?.startsWith('language-')
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('font-mono', className)} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded border bg-muted p-2 text-[0.85em] leading-snug">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function TableResultFootnote({ metadata }: { metadata: ApiResponseMetadata }) {
  const beforeCap =
    typeof metadata.resultRowsBeforeCap === 'number'
      ? tableRowFormatter.format(metadata.resultRowsBeforeCap)
      : null
  const duration =
    typeof metadata.duration === 'number'
      ? metadata.duration.toFixed(2)
      : '0.00'

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>
        {tableRowFormatter.format(metadata.rows)} row(s) in {duration}s
      </span>
      {metadata.resultRowsTruncated ? (
        <>
          <Badge variant="outline">Capped</Badge>
          {beforeCap ? <span>{beforeCap} before cap</span> : null}
        </>
      ) : null}
    </span>
  )
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
export const TableClient = function TableClient({
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
  showFilterBar = true,
}: TableClientProps) {
  const hostId = useHostId()
  const refreshInterval = queryConfig.refreshInterval ?? 0

  // Memoize context to prevent columnDefs recalculation on every render.
  // Without this, every SWR revalidation cycle triggers full table re-renders
  // because new context object → new contextWithPrefix → new columnDefs → all cells re-render.
  const context = { ...searchParams, hostId: String(hostId) }

  const { data, metadata, error, isLoading, isValidating, refresh } =
    useTableData<Record<string, unknown>>(
      queryConfig.name,
      hostId,
      searchParams,
      refreshInterval
    )

  // Show skeleton during initial load OR if validating with no existing data
  // This prevents showing "no data" while waiting for the first response
  const isInitialLoading =
    isLoading || (isValidating && (!data || data.length === 0))

  if (isInitialLoading) {
    return <TableSkeleton />
  }

  // Get SQL for display in toolbars
  const sql = queryConfig.sql ? getSqlForDisplay(queryConfig.sql) : undefined

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
            'rounded-md shadow-none py-2 group relative',
            className
          )}
        >
          <div className="absolute top-3 right-3">
            <CardToolbar sql={sql} metadata={metadata} alwaysVisible />
          </div>
          <CardContent className="p-4">
            <Alert
              aria-label={
                title ? `${title} unavailable` : 'Table not available'
              }
              className="pr-12"
            >
              <Info />
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <p>{errorDescription}</p>
                {guidance ? (
                  <div className="flex flex-col gap-1 border-t pt-3 text-xs">
                    <GuidanceMarkdown content={guidance.enableInstructions} />
                    {guidance.docsUrl && (
                      <Button
                        asChild
                        variant="link"
                        size="sm"
                        className="h-auto justify-start p-0 text-xs"
                      >
                        <a
                          href={guidance.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View ClickHouse documentation ↗
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 border-t pt-3 text-xs">
                    <p>
                      This feature requires additional ClickHouse configuration.
                    </p>
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="h-auto justify-start p-0 text-xs"
                    >
                      <a
                        href="https://clickhouse.com/docs/en/operations/system-tables"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View ClickHouse documentation ↗
                      </a>
                    </Button>
                  </div>
                )}
                {showRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => refresh()}
                  >
                    <RefreshCw data-icon="inline-start" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
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
        className={cn(
          'rounded-md shadow-none py-2 group relative',
          errorClassName,
          className
        )}
        role="alert"
        aria-label={title ? `${title} error` : 'Error loading table'}
      >
        <div className="absolute top-3 right-3">
          <CardToolbar sql={sql} metadata={metadata} alwaysVisible />
        </div>
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
          'rounded-md border-warning/30 bg-warning/5 shadow-none py-2 group relative',
          className
        )}
      >
        <div className="absolute top-3 right-3">
          <CardToolbar sql={sql} metadata={metadata} alwaysVisible />
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              variant="no-data"
              title={title || 'No Data'}
              description="No data available for this query. Try adjusting your filters or check back later."
            />
            {queryConfig.suggestion && (
              <SuggestionCard
                suggestion={queryConfig.suggestion}
                className="mt-4"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DataTable
      title={title}
      description={description}
      queryConfig={queryConfig}
      data={data}
      context={context}
      defaultPageSize={defaultPageSize}
      footnote={
        metadata ? <TableResultFootnote metadata={metadata} /> : undefined
      }
      className={className}
      topRightToolbarExtras={topRightToolbarExtras}
      enableColumnFilters={enableColumnFilters}
      filterableColumns={filterableColumns}
      isRefreshing={isValidating}
      enableRowSelection={enableRowSelection}
      metadata={metadata}
      showFilterBar={showFilterBar}
    />
  )
}
