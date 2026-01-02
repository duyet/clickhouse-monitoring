'use client'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { DateRangeConfig, DateRangeValue } from '@/components/date-range'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
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
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        'rounded-lg border-border/50 bg-card/50 flex flex-col h-full w-full min-w-0 group gap-2 shadow-none pt-1 pb-2',
        'transition-all duration-200 hover:border-border/80',
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
