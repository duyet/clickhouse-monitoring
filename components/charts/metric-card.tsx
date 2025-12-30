'use client'

import type { ReactNode } from 'react'
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
import { EmptyState, type EmptyStateVariant } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { type ApiError, ApiErrorType } from '@/lib/api/types'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type MetricTheme =
  | 'default'
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'indigo'

export type MetricVariant =
  | 'default'   // Custom render via children
  | 'single'    // Single large value with optional unit
  | 'dual'      // Two stacked values with units
  | 'list'      // Key-value rows
  | 'subtitle'  // Value with subtitle text
  | 'trend'     // Value with trend indicator

export interface MetricListItem {
  label: string
  value: string | number
  format?: 'text' | 'mono' | 'truncate'
}

export interface MetricCardProps<TData = unknown> {
  /** SWR-like response from useChartData hook */
  swr: {
    data?: TData[] | TData | Record<string, unknown> | unknown
    error?: Error | null
    isLoading?: boolean
    mutate?: () => void
    refresh?: () => void
    sql?: string
  }
  /** Card title */
  title: string
  /** Card description (subtitle) */
  description?: string
  /** Link href for "View all" action */
  viewAllHref?: string
  /** Link label (default: "View all") */
  viewAllLabel?: string
  /** Visual theme for the card */
  theme?: MetricTheme
  /** Icon to display */
  icon?: ReactNode
  /** Container className */
  className?: string

  /** Display variant */
  variant?: MetricVariant
  /** Compact mode for tighter spacing */
  compact?: boolean

  /** For 'single' variant: the value to display */
  value?: string | number | ((data: TData[]) => string | number)
  /** For 'single' variant: unit label (e.g., "queries") */
  unit?: string

  /** For 'dual' variant: first value */
  value1?: string | number | ((data: TData[]) => string | number)
  /** For 'dual' variant: first unit label */
  unit1?: string
  /** For 'dual' variant: second value */
  value2?: string | number | ((data: TData[]) => string | number)
  /** For 'dual' variant: second unit label */
  unit2?: string

  /** For 'list' variant: array of label-value pairs */
  items?: MetricListItem[] | ((data: TData[]) => MetricListItem[])

  /** For 'subtitle' variant: subtitle text */
  subtitle?: string | ((data: TData[]) => string)

  /** For 'trend' variant: trend value (positive/negative for up/down) */
  trend?: number | ((data: TData[]) => number)
  /** For 'trend' variant: trend label */
  trendLabel?: string | ((data: TData[]) => string)

  /** Custom render function (only used with variant='default') */
  children?: (data: TData[]) => React.ReactNode
}

// ============================================================================
// Theme Definitions
// ============================================================================

const THEME_CONFIGS: Record<
  MetricTheme,
  {
    gradient: string
    iconColor: string
    textColor: string
    bgColor: string
  }
> = {
  default: {
    gradient: 'from-slate-500/10 to-slate-600/5',
    iconColor: 'text-slate-500 dark:text-slate-400',
    textColor: 'text-slate-700 dark:text-slate-200',
    bgColor: 'bg-slate-50/80 dark:bg-slate-900/50',
  },
  purple: {
    gradient: 'from-purple-500/20 via-violet-500/15 to-indigo-500/10',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textColor: 'text-purple-700 dark:text-purple-200',
    bgColor: 'bg-purple-50/90 dark:bg-purple-950/40',
  },
  blue: {
    gradient: 'from-blue-500/20 via-sky-500/15 to-cyan-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-700 dark:text-blue-200',
    bgColor: 'bg-blue-50/90 dark:bg-blue-950/40',
  },
  green: {
    gradient: 'from-emerald-500/20 via-green-500/15 to-teal-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-700 dark:text-emerald-200',
    bgColor: 'bg-emerald-50/90 dark:bg-emerald-950/40',
  },
  orange: {
    gradient: 'from-orange-500/20 via-amber-500/15 to-yellow-500/10',
    iconColor: 'text-orange-600 dark:text-orange-400',
    textColor: 'text-orange-700 dark:text-orange-200',
    bgColor: 'bg-orange-50/90 dark:bg-orange-950/40',
  },
  pink: {
    gradient: 'from-pink-500/20 via-rose-500/15 to-red-500/10',
    iconColor: 'text-pink-600 dark:text-pink-400',
    textColor: 'text-pink-700 dark:text-pink-200',
    bgColor: 'bg-pink-50/90 dark:bg-pink-950/40',
  },
  cyan: {
    gradient: 'from-cyan-500/20 via-teal-500/15 to-emerald-500/10',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    textColor: 'text-cyan-700 dark:text-cyan-200',
    bgColor: 'bg-cyan-50/90 dark:bg-cyan-950/40',
  },
  indigo: {
    gradient: 'from-indigo-500/20 via-violet-500/15 to-purple-500/10',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    textColor: 'text-indigo-700 dark:text-indigo-200',
    bgColor: 'bg-indigo-50/90 dark:bg-indigo-950/40',
  },
}

// ============================================================================
// Error Handling
// ============================================================================

function getErrorVariant(error: Error | ApiError): EmptyStateVariant {
  const apiError = error as ApiError
  const message = error.message?.toLowerCase() ?? ''

  if (apiError.type === ApiErrorType.TableNotFound) return 'table-missing'
  if (apiError.type === ApiErrorType.NetworkError) return 'offline'
  if (message.includes('offline') || message.includes('network') || message.includes('fetch'))
    return 'offline'
  if (message.includes('timeout') || message.includes('timed out')) return 'timeout'

  return 'error'
}

function getErrorDescription(error: Error | ApiError, variant: EmptyStateVariant): string {
  if (variant === 'offline') {
    return 'Unable to connect to the server. Check your network connection.'
  }
  if (variant === 'timeout') {
    return 'The query took too long to execute. Please try again.'
  }
  if (error.message && error.message.length < 200) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

// ============================================================================
// Value Extractors
// ============================================================================

function extractValue<T>(
  value: string | number | ((data: T[]) => string | number) | undefined,
  data: T[]
): string | number {
  if (typeof value === 'function') return value(data)
  return value ?? '-'
}

function extractItems<T>(
  items: MetricListItem[] | ((data: T[]) => MetricListItem[]) | undefined,
  data: T[]
): MetricListItem[] {
  if (typeof items === 'function') return items(data)
  return items ?? []
}

// ============================================================================
// Variant Renderers
// ============================================================================

function renderSingleVariant<T>(
  value: string | number | ((data: T[]) => string | number) | undefined,
  unit: string | undefined,
  data: T[],
  compact = false
): ReactNode {
  const resolvedValue = extractValue(value, data)

  return (
    <div className="flex items-baseline gap-1">
      <span className={cn(
        'font-mono font-bold tabular-nums tracking-tight',
        compact ? 'text-sm sm:text-base' : 'text-2xl sm:text-3xl'
      )}>
        {resolvedValue}
      </span>
      {unit && <span className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>{unit}</span>}
    </div>
  )
}

function renderDualVariant<T>(
  value1: string | number | ((data: T[]) => string | number) | undefined,
  unit1: string | undefined,
  value2: string | number | ((data: T[]) => string | number) | undefined,
  unit2: string | undefined,
  data: T[],
  compact = false
): ReactNode {
  const v1 = extractValue(value1, data)
  const v2 = extractValue(value2, data)

  return (
    <div className={cn('space-y-1', compact && 'space-y-0.5')}>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'font-mono font-bold tabular-nums tracking-tight',
          compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
        )}>
          {v1}
        </span>
        {unit1 && <span className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>{unit1}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'font-mono font-bold tabular-nums tracking-tight',
          compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
        )}>
          {v2}
        </span>
        {unit2 && <span className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>{unit2}</span>}
      </div>
    </div>
  )
}

function renderListVariant<T>(
  items: MetricListItem[] | ((data: T[]) => MetricListItem[]) | undefined,
  data: T[],
  compact = false
): ReactNode {
  const resolvedItems = extractItems(items, data)

  return (
    <div className={cn('space-y-1.5', compact ? 'space-y-1' : '')}>
      {resolvedItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-1.5"
        >
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {item.label}
          </span>
          <div
            className={cn(
              'truncate font-semibold text-right',
              compact ? 'text-xs' : 'text-sm',
              item.format === 'mono' && 'font-mono tabular-nums',
              item.format === 'truncate' && cn(
                'max-w-[120px] sm:max-w-[140px]',
                compact && 'max-w-[100px] sm:max-w-[120px]'
              )
            )}
            title={String(item.value)}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderSubtitleVariant<T>(
  value: string | number | ((data: T[]) => string | number) | undefined,
  subtitle: string | ((data: T[]) => string) | undefined,
  data: T[],
  compact = false
): ReactNode {
  const resolvedValue = extractValue(value, data)
  const resolvedSubtitle = typeof subtitle === 'function'
    ? subtitle(data)
    : subtitle

  return (
    <div>
      <div className={cn(
        'font-mono font-bold tabular-nums tracking-tight',
        compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
      )}>
        {resolvedValue}
      </div>
      {resolvedSubtitle && (
        <div className={cn(
          'flex items-center gap-0.5 text-muted-foreground',
          compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'
        )}>
          {resolvedSubtitle}
        </div>
      )}
    </div>
  )
}

function renderTrendVariant<T>(
  value: string | number | ((data: T[]) => string | number) | undefined,
  trend: number | ((data: T[]) => number) | undefined,
  trendLabel: string | ((data: T[]) => string) | undefined,
  data: T[],
  compact = false
): ReactNode {
  const resolvedValue = extractValue(value, data)
  const resolvedTrend = typeof trend === 'function' ? trend(data) : trend
  const resolvedTrendLabel = typeof trendLabel === 'function'
    ? trendLabel(data)
    : trendLabel

  // Handle undefined trend by treating it as neutral (no trend shown)
  const trendValue = resolvedTrend ?? 0
  const isPositive = trendValue > 0
  const isNeutral = trendValue === 0

  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          'font-mono font-bold tabular-nums tracking-tight',
          compact ? 'text-sm sm:text-base' : 'text-2xl sm:text-3xl'
        )}>
          {resolvedValue}
        </span>
        {!isNeutral && (
          <div
            className={cn(
              'flex items-center gap-0.5 font-medium',
              compact ? 'text-[10px]' : 'text-xs',
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            )}
          >
            {isPositive ? (
              <TrendingUpIcon className={cn(compact ? 'size-2.5' : 'size-3')} />
            ) : (
              <TrendingDownIcon className={cn(compact ? 'size-2.5' : 'size-3')} />
            )}
            <span className="font-mono tabular-nums">
              {Math.abs(trendValue).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {resolvedTrendLabel && (
        <div className={cn(
          'text-muted-foreground',
          compact ? 'text-[10px] mt-0.5' : 'text-xs mt-1'
        )}>
          {resolvedTrendLabel}
        </div>
      )}
    </div>
  )
}

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
  // list props
  items,
  // subtitle props
  subtitle,
  // trend props
  trend,
  trendLabel,
  // custom render
  children,
}: MetricCardProps<TData>) {
  const { data, isLoading, error, mutate, refresh } = swr
  const retry = mutate || refresh || (() => {})

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
    const errorVariant = getErrorVariant(error)
    const errorDescription = getErrorDescription(error, errorVariant)

    return (
      <Card
        className={cn(
          'relative overflow-hidden rounded-xl border',
          'bg-card',
          errorVariant === 'error' && 'border-destructive/30 bg-destructive/5',
          errorVariant === 'timeout' && 'border-warning/30 bg-warning/5',
          errorVariant === 'offline' && 'border-warning/30 bg-warning/5',
          className
        )}
        role="alert"
        aria-label={`Error loading ${title}`}
      >
        <CardHeader className={cn(
          'px-2.5 sm:px-3',
          compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
        )}>
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {icon && (
                <div className={cn('shrink-0', themeConfig.iconColor)}>{icon}</div>
              )}
              <div>
                <CardTitle className={cn('font-semibold tracking-tight', compact ? 'text-xs' : 'text-sm')}>
                  {title}
                </CardTitle>
                {description && (
                  <CardDescription className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn(
          'px-2.5 pt-0 sm:px-3',
          compact ? 'pb-1' : 'pb-3 sm:px-4'
        )}>
          <EmptyState
            variant={errorVariant}
            title={errorVariant === 'error' ? 'Failed to load' : undefined}
            description={errorDescription}
            compact
            action={{
              label: 'Retry',
              onClick: retry,
              icon: <RefreshCwIcon className={cn('mr-1', compact ? 'size-2.5' : 'size-3.5')} />,
            }}
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
        <CardHeader className={cn(
          'px-2.5 sm:px-3',
          compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
        )}>
          <div className="flex items-center gap-1.5">
            {icon && (
              <div className={cn('shrink-0 opacity-50', themeConfig.iconColor)}>
                {icon}
              </div>
            )}
            <div>
              <CardTitle className={cn('font-semibold tracking-tight', compact ? 'text-xs' : 'text-sm')}>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn(
          'px-2.5 pt-0 sm:px-3',
          compact ? 'pb-1' : 'pb-1.5'
        )}>
          <div className={cn('font-bold tabular-nums text-muted-foreground/30', compact ? 'text-lg' : 'text-2xl')}>
            —
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render content based on variant
  const content = (() => {
    switch (variant) {
      case 'single':
        return renderSingleVariant(value, unit, dataArray, compact)
      case 'dual':
        return renderDualVariant(value1, unit1, value2, unit2, dataArray, compact)
      case 'list':
        return renderListVariant(items, dataArray, compact)
      case 'subtitle':
        return renderSubtitleVariant(value, subtitle, dataArray, compact)
      case 'trend':
        return renderTrendVariant(value, trend, trendLabel, dataArray, compact)
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
      {/* Content */}
      <div className="relative">
        <CardHeader className={cn(
          'px-2.5 sm:px-3',
          compact ? 'pb-1 pt-1' : 'pb-2 pt-2'
        )}>
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
                  <CardDescription className={cn(
                    'text-muted-foreground truncate',
                    compact ? 'text-[10px]' : 'text-xs'
                  )}>
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
        <CardContent className={cn(
          'px-2.5 pt-0 sm:px-3',
          compact ? 'pb-1' : 'pb-2.5'
        )}>{content}</CardContent>
      </div>
    </Card>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

interface MetricCardSkeletonProps {
  title?: string
  description?: string
  theme?: MetricTheme
  icon?: ReactNode
  variant?: MetricVariant
  compact?: boolean
  className?: string
}

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
      <div className="relative">
        <CardHeader className={cn(
          'px-2.5 sm:px-3',
          compact ? 'pb-0.5 pt-1' : 'pb-0.5 pt-1.5'
        )}>
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
              <Skeleton className={cn('rounded-md', compact ? 'size-5' : 'size-8')} />
            )}
            <div className="flex-1 space-y-0.5">
              {title ? (
                <CardTitle className={cn('font-semibold tracking-tight', compact ? 'text-xs' : 'text-sm')}>
                  {title}
                </CardTitle>
              ) : (
                <Skeleton className={cn(compact ? 'h-3' : 'h-4', 'w-24')} />
              )}
              {description ? (
                <CardDescription className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
                  {description}
                </CardDescription>
              ) : (
                <Skeleton className={cn(compact ? 'h-2.5' : 'h-3', 'w-16')} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn(
          'px-2.5 pt-0 sm:px-3',
          compact ? 'pb-1' : 'pb-1.5'
        )}>
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
  Loader: (
    <Loader2Icon className="size-4 animate-spin" strokeWidth={2.5} />
  ),
  Refresh: <RefreshCwIcon className="size-4" strokeWidth={2.5} />,
  TrendingDown: <TrendingDownIcon className="size-4" strokeWidth={2.5} />,
  TrendingUp: <TrendingUpIcon className="size-4" strokeWidth={2.5} />,
} as const
