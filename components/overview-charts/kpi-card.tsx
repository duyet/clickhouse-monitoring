'use client'

import type { LucideIcon } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

import type { ReactNode } from 'react'

import {
  type CardVariant,
  cardStyles,
  progressColors,
  progressFillStyles,
  progressTrackStyles,
} from './card-styles'
import { memo, useId } from 'react'
import { AnimatedNumber } from '@/components/cards/animated-number'
import { AppLink as Link } from '@/components/ui/app-link'
import { cn } from '@/lib/utils'

/** Accent tone for the card's icon. */
export type KpiTone = 'amber' | 'blue' | 'violet' | 'green' | 'rose' | 'neutral'

const TONE_ICON: Record<KpiTone, string> = {
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  violet: 'text-violet-600 dark:text-violet-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  rose: 'text-rose-600 dark:text-rose-400',
  neutral: 'text-muted-foreground',
}

export interface KpiCardProps {
  /** Lucide icon shown next to the label. */
  icon: LucideIcon
  /** Short uppercase label, e.g. "Active Queries". */
  label: string
  /** Headline value. Numbers (and digit-leading strings) count up. */
  value: string | number
  /** Optional unit rendered next to the value, e.g. "running". */
  unit?: string
  /** Optional secondary line below the value / progress bar. */
  sub?: ReactNode
  /** Icon accent tone. */
  tone?: KpiTone
  /** 0–100 — renders a progress bar between the value and the sub line. */
  progress?: number
  /** Progress bar variant for warning / danger coloring. */
  progressVariant?: CardVariant
  /** Optional real-data sparkline series shown top-right. */
  spark?: number[]
  /** Sparkline stroke color (CSS color). */
  sparkColor?: string
  /** Makes the whole card a link to this href. */
  href?: string
  isLoading?: boolean
}

/** A tiny smooth Recharts area sparkline for the KPI header. */
function KpiSparkline({ data, color }: { data: number[]; color: string }) {
  const gradientId = useId()
  if (data.length < 2) return null

  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <div className="h-[22px] w-16 shrink-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Headline numbers animate; version/uptime strings render as-is. */
function isCountable(value: string | number): boolean {
  return typeof value === 'number' || /^-?\d/.test(String(value))
}

const VALUE_CLASS =
  'text-[26px] sm:text-[28px] font-bold leading-none tabular-nums tracking-tight text-foreground/90 dark:text-foreground/85'

/**
 * KpiCard — one overview KPI with a consistent layout across the strip:
 * `icon + label` → `value + unit` → optional `progress` → optional `sub`.
 *
 * Replaces the previous mix of split / progress / info cards so all four
 * overview metrics read with equal visual weight.
 */
export const KpiCard = memo(function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  tone = 'neutral',
  progress,
  progressVariant = 'default',
  spark,
  sparkColor,
  href,
  isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className={cn(cardStyles.base, 'gap-2.5 p-3 sm:p-4')}>
        <div className="h-3 w-24 animate-pulse rounded bg-foreground/[0.06]" />
        <div className="h-7 w-20 animate-pulse rounded-md bg-foreground/[0.06]" />
        <div className="h-3 w-28 animate-pulse rounded bg-foreground/[0.04]" />
      </div>
    )
  }

  const clampedProgress =
    progress != null ? Math.min(Math.max(progress, 0), 100) : null

  const content = (
    <div
      className={cn(
        cardStyles.base,
        'gap-2.5 p-3 sm:p-4',
        href && cardStyles.hover
      )}
    >
      {/* Row 1 — icon + label + optional sparkline */}
      <div className="flex items-center gap-1.5">
        <Icon className={cn('size-3.5 shrink-0', TONE_ICON[tone])} />
        <span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {spark && spark.length >= 2 ? (
          <span className="ml-auto">
            <KpiSparkline
              data={spark}
              color={sparkColor ?? 'hsl(217 91% 60%)'}
            />
          </span>
        ) : href ? (
          <span className="ml-auto text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
        ) : null}
      </div>

      {/* Row 2 — value + unit */}
      <div className="flex items-baseline gap-1.5">
        {isCountable(value) ? (
          <AnimatedNumber value={value} className={VALUE_CLASS} />
        ) : (
          <span className={cn(VALUE_CLASS, 'truncate font-mono')}>{value}</span>
        )}
        {unit && (
          <span className="text-[13px] font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {/* Row 3 — optional progress bar */}
      {clampedProgress != null && (
        <div className={progressTrackStyles}>
          <div
            className={cn(progressFillStyles, progressColors[progressVariant])}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}

      {/* Row 4 — optional sub line */}
      {sub && (
        <div className="truncate text-[11.5px] leading-snug text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    )
  }

  return content
})
