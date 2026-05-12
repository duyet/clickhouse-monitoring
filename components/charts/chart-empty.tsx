'use client'

import { Inbox, RefreshCw } from 'lucide-react'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { chartCard } from '@/components/charts/chart-card-styles'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { SuggestionCard } from '@/components/ui/suggestion-card'
import { cn } from '@/lib/utils'

interface ChartEmptyProps {
  title?: string
  className?: string
  description?: string
  /** Helpful suggestion displayed below the empty state message */
  suggestion?: string
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

export const ChartEmpty = memo(function ChartEmpty({
  title,
  className,
  description,
  suggestion,
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
      className={cn(chartCard.base, chartCard.variants.default, className)}
      role="status"
      aria-label={title ? `${title} - no data` : 'No data available'}
    >
      {/* Header with title and toolbar */}
      {(title || hasToolbar) && (
        <CardHeader className={chartCard.header}>
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
        className={cn(
          compact ? chartCard.contentCompact : chartCard.content,
          'flex flex-col items-center justify-center py-8'
        )}
      >
        <div className="mb-4 rounded-full bg-muted/30 p-3">
          <Inbox
            className="h-6 w-6 text-muted-foreground/50"
            strokeWidth={1.5}
          />
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {title ? `${title} - No data` : 'No data available'}
        </p>

        {(description || !title) && (
          <p className="mt-1.5 text-xs text-muted-foreground/60 max-w-sm text-center leading-relaxed">
            {description ||
              'There is no data to display. This could be due to no activity in the selected time period.'}
          </p>
        )}

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 gap-1.5 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh data
          </Button>
        )}

        {suggestion && (
          <div className="mt-6 w-full max-w-sm">
            <SuggestionCard suggestion={suggestion} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})
