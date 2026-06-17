import type { LucideIcon } from 'lucide-react'
import { Maximize2 } from 'lucide-react'

import type { HealthStatus } from '@/lib/health/health-status'
import type { RelatedLink } from './health-checks'

import { MiniAreaChart } from '@/components/charts/mini-charts'
import { AppLink } from '@/components/ui/app-link'
import { cn } from '@/lib/utils'

/** Sparkline stroke color per severity (healthy → blue, matching KPI cards). */
const SPARK_COLOR: Record<HealthStatus, string> = {
  critical: 'hsl(0 84% 60%)',
  warning: 'hsl(38 92% 50%)',
  ok: 'hsl(217 91% 60%)',
  error: 'hsl(0 0% 60%)',
  loading: 'hsl(0 0% 60%)',
}

const VALUE_COLOR: Record<HealthStatus, string> = {
  critical: 'text-red-600 dark:text-red-500',
  warning: 'text-amber-600 dark:text-amber-500',
  ok: 'text-foreground',
  error: 'text-muted-foreground',
  loading: 'text-foreground',
}

const ICON_COLOR: Record<HealthStatus, string> = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  ok: 'text-green-500',
  error: 'text-muted-foreground',
  loading: 'text-muted-foreground',
}

function StatusDot({ status }: { status: HealthStatus }) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full flex-shrink-0',
        status === 'ok' && 'bg-green-500',
        status === 'warning' && 'bg-amber-500',
        status === 'critical' && 'bg-red-500',
        status === 'loading' && 'bg-muted animate-pulse',
        status === 'error' && 'bg-muted'
      )}
      role="img"
      aria-label={`Status: ${status}`}
    />
  )
}

function SeverityBadge({ status }: { status: HealthStatus }) {
  if (status !== 'critical' && status !== 'warning') return null
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none',
        status === 'critical' && 'bg-red-500/15 text-red-600 dark:text-red-400',
        status === 'warning' &&
          'bg-amber-500/15 text-amber-600 dark:text-amber-400'
      )}
    >
      {status === 'critical' ? 'Critical' : 'Warning'}
    </span>
  )
}

/** Pad a single observation to a flat 2-point line so it still renders. */
function toSeries(spark: number[] | undefined): number[] | null {
  if (!spark || spark.length === 0) return null
  if (spark.length === 1) return [spark[0], spark[0]]
  return spark
}

export interface HealthCardShellProps {
  icon?: LucideIcon
  title: string
  status: HealthStatus
  /** Formatted headline value, e.g. "106" or "84.9%". */
  displayValue: string
  /** Secondary line under the value. */
  sublabel: string
  /** Observed values, oldest first, for the trend sparkline. */
  spark?: number[]
  /** Related internal pages, rendered as tappable chips. */
  links?: readonly RelatedLink[]
  /** Active host, used to append `?host=` to related links. */
  hostId: number
  /** When provided, the value area opens details and a hover button appears. */
  onExpand?: () => void
}

/**
 * Shared visual chrome for every health card: severity-tinted surface, header
 * (icon + title + badge + status dot), headline value, trend sparkline, and a
 * footer of related-page chips. Purely presentational — all status/value
 * computation happens upstream in the grid.
 */
export function HealthCardShell({
  icon: Icon,
  title,
  status,
  displayValue,
  sublabel,
  spark,
  links,
  hostId,
  onExpand,
}: HealthCardShellProps) {
  const series = toSeries(spark)
  const withHost = (href: string) =>
    `${href}${href.includes('?') ? '&' : '?'}host=${hostId}`

  return (
    <div
      className={cn(
        'group flex min-h-[200px] flex-col rounded-xl border bg-card p-4 shadow-sm transition-colors',
        status === 'critical' && 'border-red-500/40 bg-red-500/[0.04]',
        status === 'warning' && 'border-amber-500/40 bg-amber-500/[0.04]'
      )}
    >
      {/* Header: icon + title · badge + status dot + (optional) expand */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && (
            <Icon
              className={cn('size-4 flex-shrink-0', ICON_COLOR[status])}
              aria-hidden
            />
          )}
          <span className="truncate text-[13px] font-semibold leading-tight">
            {title}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <SeverityBadge status={status} />
          <StatusDot status={status} />
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              aria-label={`Open ${title} details`}
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Maximize2 className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body: headline value + sub-label */}
      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          className="mt-3 text-left"
          aria-label={`Open ${title} details`}
        >
          <div
            className={cn(
              'font-mono text-[34px] font-semibold leading-none tracking-tight tabular-nums',
              VALUE_COLOR[status]
            )}
          >
            {displayValue}
          </div>
          <div className="mt-2 text-[12.5px] leading-snug text-muted-foreground">
            {sublabel}
          </div>
        </button>
      ) : (
        <div className="mt-3">
          <div
            className={cn(
              'font-mono text-[34px] font-semibold leading-none tracking-tight tabular-nums',
              VALUE_COLOR[status]
            )}
          >
            {displayValue}
          </div>
          <div className="mt-2 text-[12.5px] leading-snug text-muted-foreground">
            {sublabel}
          </div>
        </div>
      )}

      {/* Trend sparkline (real observed values, fills in over time) */}
      <div className="mt-3 h-[30px]">
        {series && (
          <MiniAreaChart
            data={series}
            label={title}
            color={SPARK_COLOR[status]}
          />
        )}
      </div>

      {/* Footer: related-page chips */}
      {links && links.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-3.5">
          {links.slice(0, 3).map((l) => (
            <AppLink
              key={l.href}
              href={withHost(l.href)}
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5',
                'text-[11px] font-medium leading-none whitespace-nowrap',
                'bg-muted/60 text-muted-foreground',
                'transition-colors hover:bg-muted hover:text-foreground'
              )}
            >
              {l.label}
            </AppLink>
          ))}
        </div>
      )}
    </div>
  )
}
