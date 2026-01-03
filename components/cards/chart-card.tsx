'use client'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { DateRangeConfig, DateRangeValue } from '@/components/date-range'
import type { StaleError } from '@/lib/swr'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { chartCard } from '@/components/charts/chart-card-styles'
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
    <Card className={cn(chartCard.base, chartCard.variants.normal, className)}>
      {title ? (
        <CardHeader className={chartCard.header}>
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
        className={cn(chartCard.content, 'overflow-hidden', contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  )
})
