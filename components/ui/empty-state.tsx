import {
  CircleSlash,
  DatabaseZap,
  Filter,
  Inbox,
  RefreshCw,
  SearchX,
  ServerCrash,
  Timer,
  WifiOff,
} from 'lucide-react'

import { Button } from './button'
import { memo } from 'react'
import { cn } from '@/lib/utils'

export type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'error'
  | 'loading'
  | 'offline'
  | 'table-missing'
  | 'timeout'
  | 'filtered-empty'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string | React.ReactNode
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Inline refresh callback - shows small refresh icon next to title */
  onRefresh?: () => void
  className?: string
  /** Smaller variant for inline use */
  compact?: boolean
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: React.ReactNode; title: string; description: string }
> = {
  'no-data': {
    icon: (
      <Inbox className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
    ),
    title: 'No data available',
    description:
      'There is no data to display. This could be due to no activity in the selected time period.',
  },
  'no-results': {
    icon: (
      <SearchX
        className="h-10 w-10 text-muted-foreground/60"
        strokeWidth={1.5}
      />
    ),
    title: 'No results found',
    description:
      "Try adjusting your search or filter criteria to find what you're looking for.",
  },
  error: {
    icon: (
      <ServerCrash
        className="h-10 w-10 text-destructive/60"
        strokeWidth={1.5}
      />
    ),
    title: 'Failed to load data',
    description: 'An error occurred while fetching data. Please try again.',
  },
  loading: {
    icon: (
      <RefreshCw
        className="h-10 w-10 text-muted-foreground/60 animate-spin"
        strokeWidth={1.5}
      />
    ),
    title: 'Loading...',
    description: 'Please wait while we fetch your data.',
  },
  offline: {
    icon: <WifiOff className="h-10 w-10 text-warning/60" strokeWidth={1.5} />,
    title: "You're offline",
    description: 'Check your internet connection and try again.',
  },
  'table-missing': {
    icon: (
      <DatabaseZap
        className="h-10 w-10 text-muted-foreground/60"
        strokeWidth={1.5}
      />
    ),
    title: 'Table not available',
    description:
      "This feature requires additional ClickHouse configuration or the system table doesn't exist.",
  },
  timeout: {
    icon: <Timer className="h-10 w-10 text-warning/60" strokeWidth={1.5} />,
    title: 'Request timed out',
    description:
      'The query took too long to execute. Try narrowing your search or increasing the timeout.',
  },
  'filtered-empty': {
    icon: (
      <Filter
        className="h-10 w-10 text-muted-foreground/60"
        strokeWidth={1.5}
      />
    ),
    title: 'No matching results',
    description:
      'No data matches your current filters. Try removing some filters.',
  },
}

export const EmptyState = memo(function EmptyState({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  secondaryAction,
  onRefresh,
  className,
  compact = false,
}: EmptyStateProps) {
  const config = variantConfig[variant]

  if (compact) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-4 text-center',
          className
        )}
      >
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
          {icon || config.icon}
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-muted-foreground">
            {title || config.title}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-0.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-2 h-7 text-xs"
          >
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-2 text-center',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        className
      )}
    >
      {/* Decorative background circles */}
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-muted/20 animate-pulse" />
        <div className="absolute inset-0 scale-125 rounded-full bg-muted/40" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 backdrop-blur-sm">
          {icon || config.icon}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <h3 className="text-base font-semibold text-foreground">
          {title || config.title}
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed break-words">
        {description || config.description}
      </p>

      {(action || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="transition-all hover:shadow-sm"
            >
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
})
/**
 * Inline empty state for use within table cells or small areas
 */
export const InlineEmptyState = memo(function InlineEmptyState({
  message = 'No data',
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-muted-foreground',
        className
      )}
    >
      <CircleSlash className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="text-sm">{message}</span>
    </div>
  )
})
