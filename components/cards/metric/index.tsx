'use client'

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

// Re-export types
export * from './types'

import type { MetricTheme } from './types'

// ============================================================================
// Imports
// ============================================================================

import { THEME_CONFIGS } from './themes'
import {
  renderDualVariant,
  renderListVariant,
  renderOversizedVariant,
  renderPulseVariant,
  renderSingleVariant,
  renderSplitVariant,
  renderSubtitleVariant,
  renderTrendVariant,
} from './variants'
import { MetricCardSkeleton } from './skeleton'
import { MetricIcons } from './icons'
import type { MetricCardProps } from './types'

// Re-export icons for convenience
export { MetricIcons }

// ============================================================================
// Main Component
// ============================================================================

export function MetricCard<TData = unknown>({
  swr,
  title,
  description,
  viewAllHref,
  viewAllLabel = 'View all',
  theme = 'default',
  icon,
  className,
  variant = 'default',
  compact = false,
  // single props
  value,
  unit,
  // dual props
  value1,
  unit1,
  value2,
  unit2,
  // split props
  label1,
  label2,
  // list props
  items,
  // subtitle props
  subtitle,
  // trend props
  trend,
  trendLabel,
  // pulse props
  history,
  historyLabel,
  showSparkline,
  // custom render
  children,
}: MetricCardProps<TData>) {
  const { data, isLoading, error, mutate } = swr

  const dataArray = Array.isArray(data)
    ? data
    : data
      ? ([data] as TData[])
      : undefined

  const themeConfig = THEME_CONFIGS[theme]

  // Loading state
  if (isLoading) {
    return (
      <MetricCardSkeleton
        title={title}
        description={description}
        theme={theme}
        icon={icon}
        variant={variant}
        compact={compact}
        className={className}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <MetricCardError
        title={title}
        description={description}
        error={error}
        icon={icon}
        theme={theme}
        compact={compact}
        className={className}
        onRetry={mutate && shouldShowRetryButton(error) ? mutate : undefined}
      />
    )
  }

  // Empty state
  if (!dataArray || dataArray.length === 0) {
    return (
      <MetricCardEmpty
        title={title}
        description={description}
        icon={icon}
        theme={theme}
        compact={compact}
        className={className}
      />
    )
  }

  // Render content based on variant
  const content = (() => {
    switch (variant) {
      case 'single':
        return renderSingleVariant({ value, unit, data: dataArray, compact })
      case 'dual':
        return renderDualVariant({
          value1,
          unit1,
          value2,
          unit2,
          data: dataArray,
          compact,
        })
      case 'list':
        return renderListVariant({ items, data: dataArray, compact })
      case 'subtitle':
        return renderSubtitleVariant({
          value,
          subtitle,
          data: dataArray,
          compact,
        })
      case 'trend':
        return renderTrendVariant({
          value,
          trend,
          trendLabel,
          data: dataArray,
          compact,
        })
      case 'oversized':
        return renderOversizedVariant({ value, unit, data: dataArray, compact })
      case 'split':
        return renderSplitVariant({
          value1,
          label1,
          value2,
          label2,
          data: dataArray,
          compact,
        })
      case 'pulse':
        return renderPulseVariant({
          value,
          unit,
          trend,
          trendLabel,
          data: dataArray,
          compact,
          history,
          historyLabel,
          showSparkline,
        })
      default:
        return children?.(dataArray)
    }
  })()

  // Render metric with data
  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/40',
        'bg-card',
        className
      )}
    >
      {/* Theme gradient background */}
      <div
        className={cn(
          'absolute inset-0 -z-10 bg-gradient-to-br',
          themeConfig.gradient
        )}
      />

      {/* Content */}
      <div className="relative">
        <MetricCardHeader
          title={title}
          description={description}
          icon={icon}
          themeConfig={themeConfig}
          compact={compact}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
        />
        <CardContent
          className={cn('px-2.5 pt-0 sm:px-3', compact ? 'pb-1' : 'pb-2.5')}
        >
          {content}
        </CardContent>
      </div>
    </Card>
  )
}

// ============================================================================
// Error State Component
// ============================================================================

interface MetricCardErrorProps {
  title: string
  description?: string
  error: Error
  icon?: React.ReactNode
  theme: MetricTheme
  compact: boolean
  className?: string
  onRetry?: () => void
}

function MetricCardError({
  title,
  description,
  error,
  icon,
  theme,
  compact,
  className,
  onRetry,
}: MetricCardErrorProps) {
  const themeConfig = THEME_CONFIGS[theme]
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
}

// ============================================================================
// Empty State Component
// ============================================================================

interface MetricCardEmptyProps {
  title: string
  description?: string
  icon?: React.ReactNode
  theme: string
  compact: boolean
  className?: string
}

function MetricCardEmpty({
  title,
  description,
  icon,
  theme,
  compact,
  className,
}: MetricCardEmptyProps) {
  const themeConfig = THEME_CONFIGS[theme]

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/40',
        'bg-card',
        className
      )}
    >
      {/* Theme gradient background */}
      <div
        className={cn(
          'absolute inset-0 -z-10 bg-gradient-to-br',
          themeConfig.gradient
        )}
      />

      <CardHeader
        className={cn('px-2.5 sm:px-3', compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5')}
      >
        <div className="flex items-center gap-1.5">
          {icon && (
            <div className={cn('shrink-0 opacity-50', themeConfig.iconColor)}>
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
      </CardHeader>
      <CardContent
        className={cn('px-2.5 pt-0 sm:px-3', compact ? 'pb-1' : 'pb-1.5')}
      >
        <div
          className={cn(
            'font-bold tabular-nums text-muted-foreground/30',
            compact ? 'text-lg' : 'text-2xl'
          )}
        >
          -
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Card Header Component
// ============================================================================

interface MetricCardHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  themeConfig: { bgColor: string; iconColor: string; textColor: string }
  compact: boolean
  viewAllHref?: string
  viewAllLabel?: string
}

function MetricCardHeader({
  title,
  description,
  icon,
  themeConfig,
  compact,
  viewAllHref,
  viewAllLabel,
}: MetricCardHeaderProps) {
  return (
    <CardHeader
      className={cn('px-2.5 sm:px-3', compact ? 'pb-1 pt-1' : 'pb-2 pt-2')}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {icon && (
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-md',
                compact ? 'p-0.5' : 'p-1.5',
                themeConfig.bgColor,
                themeConfig.iconColor
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle
              className={cn(
                'font-semibold tracking-tight truncate',
                compact ? 'text-xs' : 'text-sm',
                themeConfig.textColor
              )}
            >
              {title}
            </CardTitle>
            {description && (
              <CardDescription
                className={cn(
                  'text-muted-foreground truncate',
                  compact ? 'text-[10px]' : 'text-xs'
                )}
              >
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {viewAllHref && (
          <a
            className={cn(
              'shrink-0 font-medium text-muted-foreground/60 whitespace-nowrap',
              'transition-colors hover:text-foreground',
              'underline-offset-4 hover:underline',
              compact ? 'text-[10px]' : 'text-xs'
            )}
            href={viewAllHref}
          >
            {viewAllLabel}
          </a>
        )}
      </div>
    </CardHeader>
  )
}
