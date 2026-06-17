import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, CircleX, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface HealthCounts {
  critical: number
  warning: number
  ok: number
}

interface BannerTheme {
  icon: LucideIcon
  title: string
  sub: string
  container: string
  iconWrap: string
  title_: string
}

function resolveTheme({ critical, warning, ok }: HealthCounts): BannerTheme {
  if (critical > 0) {
    return {
      icon: CircleX,
      title: 'Action required',
      sub: `${critical} critical issue${critical > 1 ? 's' : ''} and ${warning} warning${warning !== 1 ? 's' : ''} detected`,
      container: 'border-red-500/30 bg-red-500/[0.06]',
      iconWrap: 'bg-red-500/15 text-red-600 dark:text-red-500',
      title_: 'text-red-600 dark:text-red-500',
    }
  }
  if (warning > 0) {
    return {
      icon: TriangleAlert,
      title: 'Minor issues',
      sub: `${warning} warning${warning > 1 ? 's' : ''} worth a look — nothing critical`,
      container: 'border-amber-500/30 bg-amber-500/[0.06]',
      iconWrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-500',
      title_: 'text-amber-600 dark:text-amber-500',
    }
  }
  return {
    icon: CheckCircle2,
    title: 'All systems healthy',
    sub:
      ok > 0
        ? 'No issues detected across any health check'
        : 'Waiting for health checks to report',
    container: 'border-green-500/30 bg-green-500/[0.06]',
    iconWrap: 'bg-green-500/15 text-green-600 dark:text-green-500',
    title_: 'text-green-600 dark:text-green-500',
  }
}

function CountPill({
  dot,
  count,
  label,
}: {
  dot: string
  count: number
  label: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
      <span className={cn('h-2 w-2 rounded-full', dot)} />
      <span className="text-sm font-semibold tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Aggregate health banner: a severity-themed summary (action required / minor
 * issues / all healthy) plus critical / warning / healthy count pills. Driven
 * entirely by the counts the grid computes.
 */
export function HealthSummaryBanner({ counts }: { counts: HealthCounts }) {
  const theme = resolveTheme(counts)
  const Icon = theme.icon

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5',
        theme.container
      )}
      role="status"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'grid size-10 flex-none place-items-center rounded-xl',
            theme.iconWrap
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div
            className={cn('text-lg font-semibold leading-tight', theme.title_)}
          >
            {theme.title}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {theme.sub}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <CountPill dot="bg-red-500" count={counts.critical} label="critical" />
        <CountPill dot="bg-amber-500" count={counts.warning} label="warning" />
        <CountPill dot="bg-green-500" count={counts.ok} label="healthy" />
      </div>
    </div>
  )
}
