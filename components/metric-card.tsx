'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * MetricCard - Display card for single metric with optional trend
 *
 * Used on overview pages to show key metrics like connection counts,
 * query rates, memory usage, etc.
 *
 * Features:
 * - Large, prominent value display
 * - Optional icon for visual identification
 * - Trend indicator (up/down/neutral)
 * - Subtitle for additional context
 * - Hover effect with shadow elevation
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Total Queries"
 *   value="1.2M"
 *   subValue="Last 24 hours"
 *   trend="up"
 * />
 * ```
 */
export interface MetricCardProps {
  /** Label displayed above the value */
  label: string
  /** Primary metric value to display */
  value: string | number
  /** Optional secondary value or context */
  subValue?: string
  /** Optional icon component displayed on the right */
  icon?: React.ReactNode
  /** Optional trend indicator for the metric */
  trend?: 'up' | 'down' | 'neutral'
  /** Additional CSS classes to apply */
  className?: string
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  subValue,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'bg-card border border-border/60 shadow-sm',
        'transition-all duration-200 hover:shadow-md hover:border-border',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Value section */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {/* Label */}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>

            {/* Primary value */}
            <span className="text-2xl md:text-3xl font-bold text-foreground truncate">
              {value}
            </span>

            {/* Subtitle */}
            {subValue && (
              <span className="text-xs text-muted-foreground truncate">
                {subValue}
              </span>
            )}

            {/* Trend indicator */}
            {trend && (
              <div
                className={cn(
                  'mt-1 text-xs font-medium inline-flex items-center gap-1',
                  trend === 'up' && 'text-green-600 dark:text-green-400',
                  trend === 'down' && 'text-red-600 dark:text-red-400',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                <span className="capitalize">{trend}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div className="shrink-0 p-2.5 rounded-lg bg-muted/50 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
