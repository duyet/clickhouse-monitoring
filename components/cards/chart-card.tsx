'use client'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { DateRangeConfig, DateRangeValue } from '@/components/date-range'
import type { StaleError } from '@/lib/swr'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { ChartStaleIndicator } from '@/components/charts/chart-stale-indicator'
import { DateRangeSelector } from '@/components/date-range'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title?: string | React.ReactNode
  className?: string
  contentClassName?: string
  sql?: string
  data?: ChartDataPoint[]
  /** Query execution metadata */
  metadata?: CardToolbarMetadata
  children: string | React.ReactNode
  /** Date range configuration (opt-in feature) */
  dateRangeConfig?: DateRangeConfig
  /** Current selected range value */
  currentRange?: string
  /** Callback when date range changes */
  onRangeChange?: (range: DateRangeValue) => void
  /** Error from failed revalidation (data is stale) */
  staleError?: StaleError
  /** Callback to retry fetch (used with staleError) */
  onRetry?: () => void
}

export const ChartCard = memo(function ChartCard({
  title,
  sql,
  data,
  metadata,
  className,
  contentClassName,
  children,
  dateRangeConfig,
  currentRange,
  onRangeChange,
  staleError,
  onRetry,
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        'relative flex flex-col h-full w-full min-w-0 group gap-2 pt-1 pb-2',
        'overflow-hidden rounded-xl',
        'bg-gradient-to-b from-card/80 to-card/40 dark:from-card/60 dark:to-card/30',
        'border border-border/50 dark:border-border/30',
        'shadow-sm shadow-black/[0.03] dark:shadow-black/20',
        'backdrop-blur-xl',
        'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent',
        'transition-all duration-200 ease-out',
        'hover:border-border/80 dark:hover:border-border/50',
        'hover:shadow-md hover:shadow-black/[0.06] dark:hover:shadow-black/30',
        'hover:-translate-y-0.5',
        'hover:bg-gradient-to-b hover:from-card/90 hover:to-card/60 dark:hover:from-card/70 dark:hover:to-card/40',
        className
      )}
    >
      {title ? (
        <CardHeader className="px-4 shrink-0">
          <header className="flex flex-row items-center justify-between gap-2">
            <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase truncate min-w-0 flex-1">
              {title}
            </CardDescription>
            <div className="flex items-center gap-1 shrink-0">
              {staleError && onRetry && (
                <ChartStaleIndicator error={staleError} onRetry={onRetry} />
              )}
              {dateRangeConfig && onRangeChange && (
                <DateRangeSelector
                  config={dateRangeConfig}
                  value={currentRange ?? dateRangeConfig.defaultValue}
                  onChange={onRangeChange}
                />
              )}
              <CardToolbar sql={sql} data={data} metadata={metadata} />
            </div>
          </header>
        </CardHeader>
      ) : null}

      <CardContent
        className={cn(
          'p-4 pt-0 flex-1 min-h-0 overflow-hidden',
          contentClassName
        )}
      >
        {children}
      </CardContent>
    </Card>
  )
})
