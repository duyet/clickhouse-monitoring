'use client'

import {
  ActivityIcon,
  DatabaseIcon,
  HardDriveIcon,
  InfoIcon,
  Loader2Icon,
  RefreshCwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
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

// ============================================================================
// Constants
// ============================================================================

import { THEME_CONFIGS } from './themes'

// ============================================================================
// Variant Renderers
// ============================================================================

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

// ============================================================================
// Main Component
// ============================================================================

import type { MetricCardProps } from './types'

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
    const errorVariant = detectCardErrorVariant(error)
    const errorDescription = getCardErrorDescription(
      error,
      errorVariant,
      compact
    )
    const errorTitle = getCardErrorTitle(errorVariant)
    const errorClassName = getCardErrorClassName(errorVariant)
    const showRetry = mutate && shouldShowRetryButton(error)

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
              showRetry
                ? {
                    label: 'Retry',
                    onClick: mutate,
                    icon: (
                      <RefreshCwIcon
                        className={cn(
                          'mr-1',
                          compact ? 'size-2.5' : 'size-3.5'
                        )}
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

  // Empty state
  if (!dataArray || dataArray.length === 0) {
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
          className={cn(
            'px-2.5 sm:px-3',
            compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
          )}
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
// Skeleton Component
// ============================================================================

import type { MetricCardSkeletonProps } from './types'

function MetricCardSkeleton({
  title,
  description,
  theme = 'default',
  icon,
  variant = 'default',
  compact = false,
  className,
}: MetricCardSkeletonProps) {
  const themeConfig = THEME_CONFIGS[theme]

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/40',
        'bg-card',
        className
      )}
      role="status"
      aria-label={`Loading ${title || 'metric'}`}
    >
      {/* Theme gradient background */}
      <div
        className={cn(
          'absolute inset-0 -z-10 bg-gradient-to-br',
          themeConfig.gradient
        )}
      />

      <div className="relative">
        <CardHeader
          className={cn(
            'px-2.5 sm:px-3',
            compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
          )}
        >
          <div className="flex items-center gap-1.5">
            {icon ? (
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-md',
                  compact ? 'p-0.5' : 'p-1',
                  themeConfig.bgColor,
                  themeConfig.iconColor,
                  'animate-pulse'
                )}
              >
                {icon}
              </div>
            ) : (
              <Skeleton
                className={cn('rounded-md', compact ? 'size-5' : 'size-8')}
              />
            )}
            <div className="flex-1 space-y-0.5">
              {title ? (
                <CardTitle
                  className={cn(
                    'font-semibold tracking-tight',
                    compact ? 'text-xs' : 'text-sm'
                  )}
                >
                  {title}
                </CardTitle>
              ) : (
                <Skeleton className={cn(compact ? 'h-3' : 'h-4', 'w-24')} />
              )}
              {description ? (
                <CardDescription
                  className={cn(
                    'text-muted-foreground',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {description}
                </CardDescription>
              ) : (
                <Skeleton className={cn(compact ? 'h-2.5' : 'h-3', 'w-16')} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn('px-2.5 pt-0 sm:px-3', compact ? 'pb-1' : 'pb-1.5')}
        >
          {variant === 'dual' || variant === 'list' ? (
            <div className={cn('space-y-1', compact && 'space-y-0.5')}>
              <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
              <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
            </div>
          ) : variant === 'trend' ? (
            <div className="flex items-center gap-1.5">
              <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
              <Skeleton className={cn(compact ? 'h-2.5' : 'h-4', 'w-12')} />
            </div>
          ) : (
            <Skeleton className={cn('w-20', compact ? 'h-4' : 'h-7')} />
          )}
        </CardContent>
      </div>
      <span className="sr-only">Loading {title || 'metric'} data...</span>
    </Card>
  )
}

// ============================================================================
// Icon Presets
// ============================================================================

export const MetricIcons = {
  Activity: <ActivityIcon className="size-4" strokeWidth={2.5} />,
  Database: <DatabaseIcon className="size-4" strokeWidth={2.5} />,
  HardDrive: <HardDriveIcon className="size-4" strokeWidth={2.5} />,
  Info: <InfoIcon className="size-4" strokeWidth={2.5} />,
  Loader: <Loader2Icon className="size-4 animate-spin" strokeWidth={2.5} />,
  Refresh: <RefreshCwIcon className="size-4" strokeWidth={2.5} />,
  TrendingDown: <TrendingDownIcon className="size-4" strokeWidth={2.5} />,
  TrendingUp: <TrendingUpIcon className="size-4" strokeWidth={2.5} />,
} as const
