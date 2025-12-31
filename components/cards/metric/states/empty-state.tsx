'use client'

import { memo } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { THEME_CONFIGS } from '../themes'
import type { MetricTheme } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface MetricCardEmptyProps {
  /** Card title */
  title: string
  /** Card description (subtitle) */
  description?: string
  /** Icon to display */
  icon?: React.ReactNode
  /** Visual theme for the card */
  theme: MetricTheme
  /** Compact mode for tighter spacing */
  compact: boolean
  /** Container className */
  className?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * MetricCardEmpty - Empty state component for metric cards
 *
 * Displays an empty state with a muted dash placeholder.
 * Uses memo() for performance optimization.
 */
export const MetricCardEmpty = memo(function MetricCardEmpty({
  title,
  description,
  icon,
  theme,
  compact,
  className,
}: MetricCardEmptyProps) {
  const themeConfig = THEME_CONFIGS[theme as MetricTheme]

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
})
