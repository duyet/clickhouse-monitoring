import { ArrowUpRight, Inbox, RefreshCw } from 'lucide-react'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { ApiResponseMetadata } from '@/lib/api/types'
import type { ChartDataPoint } from '@/types/chart-data'

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
import { useRouter } from '@/lib/next-compat'
import { useHostId } from '@/lib/swr'
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
  /** Navigation target URL when clicked */
  href?: string
}

export const ChartEmpty = function ChartEmpty({
  title,
  className,
  description,
  suggestion,
  onRetry,
  compact = false,
  sql,
  data,
  metadata,
  href,
}: ChartEmptyProps) {
  const router = useRouter()
  const hostId = useHostId()

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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!href) return

    const target = e.target as HTMLElement
    const isInteractive = target.closest(
      'button, a, select, input, [role="button"], [role="menuitem"], [role="tab"], .interactive-element'
    )

    if (isInteractive) {
      return
    }

    router.push(`${href}${href.includes('?') ? '&' : '?'}host=${hostId}`)
  }

  return (
    <Card
      className={cn(
        chartCard.base,
        chartCard.variants.normal,
        href &&
          'cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300',
        className
      )}
      onClick={handleCardClick}
      role="status"
      aria-label={title ? `${title} - no data` : 'No data available'}
    >
      {/* Header with title and toolbar */}
      {(title || hasToolbar) && (
        <CardHeader className={chartCard.header}>
          <header className="flex flex-row items-center justify-between gap-2">
            {title ? (
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <CardDescription
                  className={cn(
                    'text-xs font-medium tracking-wide text-muted-foreground/80 uppercase truncate min-w-0 flex-1 transition-colors duration-200',
                    href && 'group-hover:text-primary'
                  )}
                >
                  {title}
                </CardDescription>
                {href && (
                  <ArrowUpRight className="size-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-60 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-muted-foreground shrink-0" />
                )}
              </div>
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
          'relative flex flex-col items-center justify-center py-6 sm:py-8 overflow-hidden'
        )}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

        <div
          className={cn(
            'mb-3 sm:mb-4 rounded-full p-3 transition-all duration-300 relative',
            'bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/10 dark:group-hover:bg-primary/20',
            'border border-primary/10 dark:border-primary/20 group-hover:border-primary/20 dark:group-hover:border-primary/30',
            'after:absolute after:inset-0 after:rounded-full after:bg-primary/20 after:blur-md after:opacity-0 group-hover:after:opacity-50 after:transition-opacity after:duration-300'
          )}
        >
          <Inbox
            className="h-5 w-5 sm:h-6 sm:w-6 text-primary/60 dark:text-primary/50 group-hover:text-primary/80 group-hover:scale-110 transition-all duration-300"
            strokeWidth={1.5}
          />
        </div>

        <p className="text-sm font-medium text-muted-foreground text-center">
          {title ? `${title} - No data` : 'No data available'}
        </p>

        {(description || !title) && (
          <p className="mt-1 text-xs text-muted-foreground/60 max-w-xs text-center leading-relaxed">
            {description ||
              'There is no data to display. This could be due to no activity in the selected time period.'}
          </p>
        )}

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3 gap-1.5 text-xs interactive-element"
          >
            <RefreshCw className="size-3" />
            Refresh data
          </Button>
        )}

        {suggestion && (
          <div className="mt-4 sm:mt-5 w-full max-w-xs interactive-element">
            <SuggestionCard suggestion={suggestion} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
