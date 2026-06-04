import type { DerivedQuery } from './types'

/**
 * Progress cell — a determinate bar with `read / total` rows when the query
 * reports progress, or an indeterminate shimmer when only the row count is
 * known. Bar color shifts blue → green as the scan completes.
 */
export function ProgressCell({ d }: { d: DerivedQuery }) {
  const { pct } = d
  const indeterminate = pct == null && d.readRows > 0
  const label = pct != null ? `${pct}%` : indeterminate ? 'Reading…' : '—'
  const denom =
    d.totalRows > 0 ? d.readableTotalRows : indeterminate ? '?' : '—'
  const color =
    pct == null
      ? 'hsl(38 92% 55%)'
      : pct >= 80
        ? 'hsl(158 64% 42%)'
        : 'hsl(217 91% 60%)'

  return (
    <div className="flex min-w-[88px] flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium tabular-nums">{label}</span>
        <span className="truncate text-right tabular-nums text-muted-foreground">
          {d.readableReadRows} / {denom}
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        {pct != null ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${Math.max(pct, 2)}%`, background: color }}
          />
        ) : indeterminate ? (
          // No known total — a segment slides across to signal live scanning.
          <div
            className="absolute inset-y-0 w-1/3 animate-rq-indeterminate rounded-full"
            style={{ background: color }}
          />
        ) : null}
      </div>
    </div>
  )
}

/** A small CPU-utilisation bar + percentage. */
export function CpuMeter({ pct }: { pct: number }) {
  const rounded = Math.round(pct)
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className="h-1 w-9 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(pct, 3)}%`,
            background: pct > 70 ? 'hsl(0 84% 60%)' : 'hsl(217 91% 60%)',
          }}
        />
      </div>
      <span className="tabular-nums">{rounded}%</span>
    </div>
  )
}
