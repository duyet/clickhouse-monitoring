'use client'

import { memo } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  detectCardErrorVariant,
} from '@/lib/card-error-utils'
import { cn } from '@/lib/utils'

// Re-export types and hooks
export * from './types'
export * from './hooks'

import type { MetricTheme } from './types'
import { useMetricState } from './hooks/use-metric-state'

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
import { MetricIcons } from './icons'
import {
  MetricCardSkeleton,
  MetricCardError,
  MetricCardEmpty,
} from './states'
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
  // Use custom hook for state management
  const { dataArray, isLoading, error, mutate, isEmpty, shouldShowRetry } =
    useMetricState<TData>({ swr })

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
        onRetry={shouldShowRetry ? mutate : undefined}
      />
    )
  }

  // Empty state
  if (isEmpty) {
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

  // At this point, dataArray is guaranteed to be TData[] (not undefined)
  // because we've already checked isEmpty which covers the undefined case
  const data = dataArray as TData[]

  // Render content based on variant
  const content = (() => {
    switch (variant) {
      case 'single':
        return renderSingleVariant({ value, unit, data, compact })
      case 'dual':
        return renderDualVariant({
          value1,
          unit1,
          value2,
          unit2,
          data,
          compact,
        })
      case 'list':
        return renderListVariant({ items, data, compact })
      case 'subtitle':
        return renderSubtitleVariant({
          value,
          subtitle,
          data,
          compact,
        })
      case 'trend':
        return renderTrendVariant({
          value,
          trend,
          trendLabel,
          data,
          compact,
        })
      case 'oversized':
        return renderOversizedVariant({ value, unit, data, compact })
      case 'split':
        return renderSplitVariant({
          value1,
          label1,
          value2,
          label2,
          data,
          compact,
        })
      case 'pulse':
        return renderPulseVariant({
          value,
          unit,
          trend,
          trendLabel,
          data,
          compact,
          history,
          historyLabel,
          showSparkline,
        })
      default:
        return children?.(data)
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

const MetricCardHeader = memo(function MetricCardHeader({
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
})
