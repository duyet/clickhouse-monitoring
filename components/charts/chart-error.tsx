'use client'

import { RefreshCw } from 'lucide-react'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  type CardError,
  detectCardErrorVariant,
  getCardErrorClassName,
  getCardErrorDescription,
  getCardErrorTitle,
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

  return (
    <Card
      className={cn(
        'rounded-md h-full shadow-none py-2',
        errorClassName,
        className
      )}
      role="alert"
      aria-label={title ? `${title} error` : 'Error loading chart'}
    >
      <CardContent className={compact ? 'p-4' : 'p-6'}>
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
      </CardContent>
    </Card>
  )
})
