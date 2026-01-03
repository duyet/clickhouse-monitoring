'use client'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ChartEmptyProps {
  title?: string
  className?: string
  description?: string
  variant?: EmptyStateVariant
  onRetry?: () => void
  /** Use compact layout for smaller charts */
  compact?: boolean
  /** SQL query that was executed */
  sql?: string
  /** Data that was returned (empty array) */
  data?: ChartDataPoint[]
  /** Query execution metadata (from API response) */
  metadata?: Partial<ApiResponseMetadata>
}

/**
 * ChartEmpty - Enhanced empty state for charts
 *
 * Displays empty state message while still providing access to:
 * - SQL query via toolbar dropdown menu
 * - Query execution metadata via toolbar dropdown menu
 * - Retry option for refreshing data
 */
export const ChartEmpty = memo(function ChartEmpty({
  title,
  className,
  description,
  variant = 'no-data',
  onRetry,
  compact = false,
  sql,
  data,
  metadata,
}: ChartEmptyProps) {
  // Use sql from props or metadata
  const effectiveSql = sql || metadata?.sql

  // Build metadata for toolbar - spread to preserve all fields (api, duration, etc.)
  const toolbarMetadata: CardToolbarMetadata | undefined = metadata
    ? { ...metadata }
    : undefined

  // Check if we have toolbar content (sql, data, or metadata)
  const hasToolbar =
    effectiveSql ||
    (data && data.length > 0) ||
    (toolbarMetadata &&
      (toolbarMetadata.api ||
        toolbarMetadata.duration !== undefined ||
        toolbarMetadata.rows !== undefined ||
        toolbarMetadata.clickhouseVersion ||
        toolbarMetadata.host ||
        toolbarMetadata.queryId))

  return (
    <Card
      className={cn(
        'rounded-lg border-border/50 bg-card/50 flex flex-col h-full gap-2 shadow-none py-2',
        className
      )}
      aria-label={title ? `${title} - no data` : 'No data available'}
    >
      {/* Header with title and toolbar */}
      {(title || hasToolbar) && (
        <CardHeader className="px-2 shrink-0">
          <header className="flex flex-row items-center justify-between gap-2">
            {title ? (
              <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase truncate min-w-0 flex-1">
                {title}
              </CardDescription>
            ) : (
              <div className="flex-1" />
            )}
            {hasToolbar && (
              <CardToolbar
                sql={effectiveSql}
                data={data}
                metadata={toolbarMetadata}
                alwaysVisible
              />
            )}
          </header>
        </CardHeader>
      )}

      {/* Empty state content */}
      <CardContent
        className={cn('flex-1 min-h-0', compact ? 'p-3' : 'p-4 pt-0')}
      >
        <EmptyState
          variant={variant}
          title={title ? undefined : 'No data'}
          description={
            description ||
            'There is no data to display. This could be due to no activity in the selected time period.'
          }
          compact={compact}
          onRefresh={onRetry}
        />
      </CardContent>
    </Card>
  )
})
