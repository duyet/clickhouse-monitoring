import { Flame } from 'lucide-react'

import { type DerivedQuery, SEVERITY_DURATION, type Severity } from './types'
import { formatDuration } from '@/components/query-tables/format-duration'
import { cn } from '@/lib/utils'

const RANK_BADGE: Record<Severity, string> = {
  critical:
    'bg-rose-100 text-rose-700 ring-1 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800',
  warning:
    'bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800',
  normal: 'bg-muted text-muted-foreground',
}

/**
 * Rank chip — "#1, #2 …" with a heat ring keyed to severity. The top three
 * offenders also get a flame so the worst queries are obvious at a glance.
 */
export function RankBadge({
  rank,
  severity,
}: {
  rank: number
  severity: Severity
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums',
        RANK_BADGE[severity]
      )}
    >
      {rank <= 3 && severity !== 'normal' && (
        <Flame className="size-3 shrink-0" />
      )}
      #{rank}
    </span>
  )
}

/** Total-time cell — the headline metric, with a heat-toned bar. */
export function TotalTimeCell({ d, max }: { d: DerivedQuery; max: number }) {
  const t = formatDuration(d.queriesDuration)
  const pct = max > 0 ? Math.min(100, (d.queriesDuration / max) * 100) : 0
  const color =
    d.severity === 'critical'
      ? 'hsl(0 84% 60%)'
      : d.severity === 'warning'
        ? 'hsl(38 92% 50%)'
        : 'hsl(217 91% 60%)'
  return (
    <div className="flex min-w-[88px] flex-col gap-1">
      <span className={cn('tabular-nums', SEVERITY_DURATION[d.severity])}>
        {t.value}
        <span className="ml-0.5 text-[10.5px] text-muted-foreground">
          {t.unit}
        </span>
      </span>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
      </div>
    </div>
  )
}
