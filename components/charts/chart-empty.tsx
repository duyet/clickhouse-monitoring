'use client'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { ApiResponseMetadata } from '@/lib/api/types'
import type { TableGuidance } from '@/lib/table-guidance'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { chartCard } from '@/components/charts/chart-card-styles'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ChartEmptyProps {
  title?: string
  className?: string
  description?: string
  /** @deprecated Use `guidance` instead */
  suggestion?: string
  /** Table guidance with description, enableInstructions, and docsUrl */
  guidance?: TableGuidance
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
 * Renders enableInstructions with basic markdown-like formatting.
 * Splits on ``` to detect code blocks.
 */
function FormattedInstructions({ text }: { text: string }) {
  const parts = text.split(/```(\w*)\n?([\s\S]*?)```/g)
  const nodes: ReactNode[] = []

  let i = 0
  while (i < parts.length) {
    if (i % 3 === 0) {
      // Plain text segment
      if (parts[i]) {
        nodes.push(
          <p key={i} className="text-sm text-foreground whitespace-pre-wrap">
            {parts[i].trim()}
          </p>
        )
      }
    } else if (i % 3 === 1) {
      // Language label (skip, used in next iteration)
    } else {
      // Code block content
      nodes.push(
        <pre
          key={i}
          className="bg-muted rounded-md p-3 text-xs overflow-x-auto font-mono"
        >
          <code>{parts[i]}</code>
        </pre>
      )
    }
    i++
  }

  return <div className="flex flex-col gap-3">{nodes}</div>
}

function TableGuidanceDialog({ guidance }: { guidance: TableGuidance }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-none text-xs text-primary underline-offset-2 hover:underline cursor-pointer whitespace-nowrap"
      >
        How to enable →
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {guidance.description ?? 'How to enable'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto max-h-96">
            <FormattedInstructions text={guidance.enableInstructions} />
            {guidance.docsUrl && (
              <a
                href={guidance.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                View Documentation →
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
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
  suggestion: _suggestion,
  guidance,
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
      className={cn(chartCard.base, chartCard.variants.default, className)}
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
        className={cn(compact ? chartCard.contentCompact : chartCard.content)}
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
        {guidance && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 flex-none" />
            <span className="truncate">{guidance.description}</span>
            <TableGuidanceDialog guidance={guidance} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})
