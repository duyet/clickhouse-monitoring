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
        'group relative overflow-hidden bg-background/50 backdrop-blur-xl border border-border/40',
        'shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]',
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-border/80 hover:-translate-y-0.5',
        'dark:shadow-[0_2px_10px_-3px_rgba(255,255,255,0.02)]',
        'dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.04)]',
        className
      )}
    >
      {/* Subtle top gradient line on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className="p-5 relative z-10 w-full h-full flex flex-col justify-center">
        <div className="flex items-start justify-between gap-3 relative">
          {/* Value section */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1 relative z-10">
            {/* Label */}
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/80 group-hover:text-muted-foreground transition-colors duration-300">
              {label}
            </span>

            {/* Primary value */}
            <span className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors duration-300 truncate">
              {value}
            </span>

            {/* Subtitle */}
            {subValue && (
              <span className="text-[13px] font-medium text-muted-foreground/70 translate-y-0.5">
                {subValue}
              </span>
            )}

            {/* Trend indicator */}
            {trend && (
              <div
                className={cn(
                  'mt-2 text-[13px] font-medium inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit',
                  trend === 'up' &&
                    'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400',
                  trend === 'down' &&
                    'text-rose-700 bg-rose-500/10 dark:text-rose-400',
                  trend === 'neutral' && 'text-muted-foreground bg-muted/50'
                )}
              >
                {trend === 'up' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 10.5V1.5M6 1.5L1.5 6M6 1.5L10.5 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1.5V10.5M6 10.5L1.5 6M6 10.5L10.5 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {trend === 'neutral' && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 6H9.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <span className="capitalize">{trend}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div className="shrink-0 p-3 rounded-2xl bg-primary/5 text-primary/80 ring-1 ring-primary/10 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
              {icon}
            </div>
          )}

          {/* Decorative blurred blob in the background */}
          <div className="absolute -inset-4 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
