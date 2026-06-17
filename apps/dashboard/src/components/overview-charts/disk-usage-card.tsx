import { HardDrive } from 'lucide-react'

import { DiskUsageBar, usageLevel } from '@/components/disks/disk-usage-bar'
import { AppLink } from '@/components/ui/app-link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatReadableSize } from '@/lib/format-readable'
import { useChartData } from '@/lib/query/use-chart-data'
import { REFRESH_INTERVAL, useHostId } from '@/lib/swr'
import { buildUrl } from '@/lib/url/url-builder'
import { cn } from '@/lib/utils'

// ============================================================================
// DiskUsageCard Component
// ============================================================================

/**
 * DiskUsageCard — overview "Disk Usage" breakdown.
 *
 * Lists every disk reported by `system.disks` with a per-disk usage bar, the
 * raw engine type, and `used / total` + free figures. The header summarises the
 * aggregate across all disks. Complements the compact single-disk Storage KPI
 * tile in the 4-up strip by showing the full storage picture at a glance.
 *
 * Reuses {@link usageLevel}/{@link DiskUsageBar} for the threshold colors so the
 * card stays consistent with the /disks detail page (90% critical, 75% warn).
 */

type DiskRow = {
  name: string
  type?: string
  used_space: number
  readable_used_space: string
  total_space: number
  readable_total_space: string
  free_space: number
  readable_free_space: string
}

type UsageLevel = ReturnType<typeof usageLevel>

/** Dot + percent text accent, matching DiskUsageBar's fill color per level. */
const LEVEL_ACCENT: Record<UsageLevel, string> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
}

const LEVEL_DOT: Record<UsageLevel, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  critical: 'bg-red-500',
}

function percentUsed(used: number, total: number): number {
  return total > 0 ? Math.min(100, (used / total) * 100) : 0
}

function DiskRowItem({ disk }: { disk: DiskRow }) {
  const pct = percentUsed(disk.used_space, disk.total_space)
  const level = usageLevel(pct)

  return (
    <div className="flex flex-col gap-1.5 border-t border-border py-4 first:border-t-0 first:pt-0">
      {/* name + type + percent */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn('size-2 shrink-0 rounded-full', LEVEL_DOT[level])}
            aria-hidden
          />
          <span className="truncate text-[13px] font-semibold leading-none">
            {disk.name}
          </span>
          {disk.type ? (
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {disk.type}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            'shrink-0 font-mono text-[13px] font-semibold tabular-nums',
            LEVEL_ACCENT[level]
          )}
        >
          {pct.toFixed(0)}%
        </span>
      </div>

      <DiskUsageBar percentUsed={pct} className="h-2" />

      <div className="flex items-center justify-between font-mono text-[11.5px] tabular-nums text-muted-foreground">
        <span>
          {disk.readable_used_space} / {disk.readable_total_space}
        </span>
        <span>{disk.readable_free_space} free</span>
      </div>
    </div>
  )
}

export const DiskUsageCard = function DiskUsageCard({
  className,
}: {
  className?: string
}) {
  const hostId = useHostId()
  const { data, isLoading, error, hasData } = useChartData<DiskRow>({
    chartName: 'disk-size-all',
    hostId,
    refreshInterval: REFRESH_INTERVAL.SLOW_2M,
  })

  if (isLoading) {
    return (
      <Card
        className={cn('gap-0 py-0', className)}
        role="status"
        aria-busy="true"
        aria-label="Loading disk usage"
      >
        <CardHeader className="gap-0 p-5 pb-0">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-44" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const disks = data ?? []

  // An errored fetch resolves with an empty `data`; distinguish it from a
  // genuine "no disks" result so a real failure is not shown as benign.
  if (disks.length === 0) {
    const message =
      error && !hasData ? 'Failed to load disk usage.' : 'No disks reported.'
    return (
      <Card className={cn('gap-0 py-0', className)}>
        <CardHeader className="gap-2 p-5">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold tracking-tight">
              Disk Usage
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 text-sm text-muted-foreground">
          {message}
        </CardContent>
      </Card>
    )
  }

  const usedSum = disks.reduce((acc, d) => acc + d.used_space, 0)
  const totalSum = disks.reduce((acc, d) => acc + d.total_space, 0)
  // Sum the native free_space column so the header total matches the sum of the
  // per-disk "free" figures shown in each row (these differ from total-used
  // when keep_free_space reservations apply).
  const freeSum = disks.reduce((acc, d) => acc + d.free_space, 0)
  const totalPct = percentUsed(usedSum, totalSum)
  const countLabel = `${disks.length} ${disks.length === 1 ? 'disk' : 'disks'}`

  return (
    <AppLink
      href={buildUrl('/disks', { host: hostId })}
      className="group block"
    >
      <Card
        className={cn(
          'gap-0 py-0 transition-colors hover:border-border',
          className
        )}
      >
        <CardHeader className="gap-0 p-5 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold tracking-tight">
                Disk Usage
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {countLabel}
              </span>
            </div>
            <div className="text-right font-mono">
              <div className="text-[13px] font-semibold tabular-nums">
                {formatReadableSize(usedSum)}{' '}
                <span className="font-normal text-muted-foreground">
                  / {formatReadableSize(totalSum)}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                {formatReadableSize(freeSum)} free · {totalPct.toFixed(0)}% used
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col p-5 pt-3">
          {disks.map((disk) => (
            <DiskRowItem key={disk.name} disk={disk} />
          ))}
        </CardContent>
      </Card>
    </AppLink>
  )
}
