'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

/**
 * KeyMetricsLevel - Level 2: Key metrics with trends
 *
 * Shows secondary metrics and trend information.
 * Revealed when user expands from headline.
 */

export interface MetricItem {
  /** Label for the metric */
  label: string
  /** Value to display */
  value: string | number
  /** Optional secondary value (e.g., previous period) */
  secondaryValue?: string | number
  /** Optional trend percentage */
  trend?: number
  /** Optional unit/suffix */
  unit?: string
}

export interface KeyMetricsLevelProps {
  /** Array of metrics to display */
  metrics: MetricItem[]
  /** Optional time range label (e.g., "Last 5 minutes") */
  timeRange?: string
  /** Additional CSS classes */
  className?: string
}

export const KeyMetricsLevel = memo(function KeyMetricsLevel({
  metrics,
  timeRange,
  className,
}: KeyMetricsLevelProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-3 px-4',
        'border-t border-border/40',
        'animate-in fade-in-0 slide-in-from-top-1 duration-300 ease-out',
        className
      )}
      role="region"
      aria-label="Key metrics and trends"
    >
      {/* Time range label */}
      {timeRange && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{timeRange}</span>
        </div>
      )}

      {/* Metrics grid */}
      <div
        className={cn(
          'grid gap-3',
          metrics.length === 1 && 'grid-cols-1',
          metrics.length === 2 && 'grid-cols-2',
          metrics.length >= 3 && 'grid-cols-2 sm:grid-cols-3'
        )}
      >
        {metrics.map((metric, index) => {
          const trendColor =
            metric.trend && metric.trend > 0
              ? 'text-emerald-500'
              : metric.trend && metric.trend < 0
                ? 'text-rose-500'
                : 'text-muted-foreground'

          return (
            <div
              key={index}
              className="flex flex-col gap-1 p-2 rounded-lg bg-foreground/[0.02]"
            >
              {/* Label */}
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </span>

              {/* Primary value */}
              <span className="font-mono font-semibold tabular-nums text-lg">
                {metric.value}
                {metric.unit && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                )}
              </span>

              {/* Footer with trend or secondary value */}
              <div className="flex items-center gap-2 text-xs">
                {metric.trend !== undefined ? (
                  <span className={cn('font-medium tabular-nums', trendColor)}>
                    {metric.trend > 0 ? '+' : ''}
                    {metric.trend}%
                  </span>
                ) : metric.secondaryValue ? (
                  <span className="text-muted-foreground tabular-nums">
                    {metric.secondaryValue}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
