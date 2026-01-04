'use client'

import { ScalingIcon } from 'lucide-react'

import type { CardToolbarMetadata } from '@/components/cards/card-toolbar'
import type { DateRangeConfig, DateRangeValue } from '@/components/date-range'
import type { StaleError } from '@/lib/swr'
import type { ChartDataPoint } from '@/types/chart-data'

import { memo } from 'react'
import { CardToolbar } from '@/components/cards/card-toolbar'
import { chartCard } from '@/components/charts/chart-card-styles'
import {
  ChartScaleProvider,
  useChartScale,
} from '@/components/charts/chart-scale-context'
import { ChartStaleIndicator } from '@/components/charts/chart-stale-indicator'
import { DateRangeSelector } from '@/components/date-range'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Log scale toggle button - visible icon next to date range
 * Matches hover behavior of other header icons
 */
function ScaleToggle() {
  const scaleContext = useChartScale()

  if (!scaleContext) return null

  const { isLogScale, toggleScale } = scaleContext

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleScale}
          className={cn(
            'size-6 rounded-full transition-opacity',
            'opacity-0 group-hover:opacity-40 hover:!opacity-100',
            isLogScale && 'text-amber-500 group-hover:opacity-70'
          )}
        >
          <ScalingIcon className="size-3.5" strokeWidth={2} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {isLogScale
          ? 'Log scale (click to disable)'
          : 'Linear scale (click for log)'}
      </TooltipContent>
    </Tooltip>
  )
}

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
  /** Enable log scale toggle (default: true for numeric charts) */
  enableScaleToggle?: boolean
}

/**
 * Inner card content that uses scale context (must be inside ChartScaleProvider)
 */
function ChartCardContentWithScale({
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
}: Omit<ChartCardProps, 'enableScaleToggle'>) {
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
              <ScaleToggle />
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
}

/**
 * Inner card content without scale context
 */
function ChartCardContentWithoutScale({
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
}: Omit<ChartCardProps, 'enableScaleToggle'>) {
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
}

export const ChartCard = memo(function ChartCard({
  enableScaleToggle = false,
  ...props
}: ChartCardProps) {
  // Wrap in ChartScaleProvider if scale toggle is enabled
  if (enableScaleToggle) {
    return (
      <ChartScaleProvider>
        <ChartCardContentWithScale {...props} />
      </ChartScaleProvider>
    )
  }

  return <ChartCardContentWithoutScale {...props} />
})
