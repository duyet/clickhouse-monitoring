'use client'

import { ExternalLink, RefreshCw } from 'lucide-react'

import { memo } from 'react'
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
import { cn } from '@/lib/utils'

interface ChartErrorProps {
  error: CardError
  title?: string
  className?: string
  onRetry?: () => void
  /** Use compact layout for smaller charts */
  compact?: boolean
}

export const ChartError = memo(function ChartError({
  error,
  title: customTitle,
  className,
  onRetry,
  compact = false,
}: ChartErrorProps) {
  const variant = detectCardErrorVariant(error)
  const title = getCardErrorTitle(variant, customTitle)
  const description = getCardErrorDescription(error, variant, compact)
  const errorClassName = getCardErrorClassName(variant)
  const showRetry = onRetry && shouldShowRetryButton(error)

  // Get table guidance for missing tables
  const tableMissingInfo = getTableMissingInfo(error)
  const hasTableGuidance = tableMissingInfo?.guidance

  return (
    <Card
      className={cn(
        'rounded-lg border-border/50 bg-card/50 flex flex-col h-full gap-2 shadow-none py-2',
        errorClassName,
        className
      )}
      role="alert"
      aria-label={title ? `${title} error` : 'Error loading chart'}
    >
      <CardContent className="p-4 flex-1 min-h-0">
        <EmptyState
          variant={variant}
          title={title}
          description={description}
          compact={compact}
          action={
            showRetry
              ? {
                  label: 'Retry',
                  onClick: onRetry,
                  icon: <RefreshCw className="mr-1.5 h-3.5 w-3.5" />,
                }
              : undefined
          }
        />
        {/* Table guidance for missing tables */}
        {hasTableGuidance && (
          <div className="mt-4 pt-3 border-t border-muted/50 text-xs space-y-2">
            <p className="text-muted-foreground">
              Enable this system log in your ClickHouse config
            </p>
            {tableMissingInfo.guidance?.docsUrl && (
              <a
                href={tableMissingInfo.guidance.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                View ClickHouse docs
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
