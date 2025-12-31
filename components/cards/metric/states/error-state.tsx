'use client'

import { memo } from 'react'
import {
  RefreshCwIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  detectCardErrorVariant,
  getCardErrorClassName,
  getCardErrorDescription,
  getCardErrorTitle,
  shouldShowRetryButton,
} from '@/lib/card-error-utils'
import { cn } from '@/lib/utils'
import { THEME_CONFIGS } from '../themes'
import type { MetricTheme } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface MetricCardErrorProps {
  /** Card title */
  title: string
  /** Card description (subtitle) */
  description?: string
  /** Error object */
  error: Error
  /** Icon to display */
  icon?: React.ReactNode
  /** Visual theme for the card */
  theme: MetricTheme
  /** Compact mode for tighter spacing */
  compact: boolean
  /** Container className */
  className?: string
  /** Optional retry callback */
  onRetry?: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * MetricCardError - Error state component for metric cards
 *
 * Displays an error state with appropriate styling and optional retry button.
 * Uses memo() for performance optimization.
 */
export const MetricCardError = memo(function MetricCardError({
  title,
  description,
  error,
  icon,
  theme,
  compact,
  className,
  onRetry,
}: MetricCardErrorProps) {
  const themeConfig = THEME_CONFIGS[theme as MetricTheme]
  const errorVariant = detectCardErrorVariant(error)
  const errorDescription = getCardErrorDescription(error, errorVariant, compact)
  const errorTitle = getCardErrorTitle(errorVariant)
  const errorClassName = getCardErrorClassName(errorVariant)

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-xl border',
        'bg-card',
        errorClassName,
        className
      )}
      role="alert"
      aria-label={`Error loading ${title}`}
    >
      <CardHeader
        className={cn(
          'px-2.5 sm:px-3',
          compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
        )}
      >
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {icon && (
              <div className={cn('shrink-0', themeConfig.iconColor)}>
                {icon}
              </div>
            )}
            <div>
              <CardTitle
                className={cn(
                  'font-semibold tracking-tight',
                  compact ? 'text-xs' : 'text-sm'
                )}
              >
                {title}
              </CardTitle>
              {description && (
                <CardDescription
                  className={cn(
                    'text-muted-foreground',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          'px-2.5 pt-0 sm:px-3',
          compact ? 'pb-1' : 'pb-3 sm:px-4'
        )}
      >
        <EmptyState
          variant={errorVariant}
          title={errorTitle}
          description={errorDescription}
          compact
          action={
            onRetry
              ? {
                  label: 'Retry',
                  onClick: onRetry,
                  icon: (
                    <RefreshCwIcon
                      className={cn('mr-1', compact ? 'size-2.5' : 'size-3.5')}
                    />
                  ),
                }
              : undefined
          }
        />
      </CardContent>
    </Card>
  )
})
