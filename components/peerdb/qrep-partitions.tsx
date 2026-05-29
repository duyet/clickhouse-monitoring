import type { QRepPartition } from '@/lib/peerdb/types'

import {
  durationMs,
  pdbFmtClock,
  pdbFmtDuration,
  pdbFmtNum,
  toNumber,
} from './peerdb-utils'

export function partitionState(
  p: QRepPartition
): 'done' | 'running' | 'queued' {
  if (p.endTime) return 'done'
  // A partition that has started (has a startTime) or already synced rows is
  // in flight; only un-started partitions are queued.
  if (p.startTime || toNumber(p.rowsSynced) > 0) return 'running'
  return 'queued'
}

const PART_TONE: Record<string, string> = {
  done: '#10b981',
  running: '#3b82f6',
  queued: '#94a3b8',
}

/** Bucket partition rows-synced by completion hour for the sync-history chart. */
export function buildSyncHistory(
  partitions: QRepPartition[]
): { x: string; y: number }[] {
  const buckets = new Map<number, number>()
  for (const p of partitions) {
    const iso = p.endTime ?? p.pullEndTime ?? p.startTime
    if (!iso) continue
    const t = Date.parse(iso)
    if (Number.isNaN(t)) continue
    const hour = Math.floor(t / 3_600_000) * 3_600_000
    buckets.set(hour, (buckets.get(hour) ?? 0) + toNumber(p.rowsSynced))
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([h, y]) => ({
      x: new Date(h).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      }),
      y,
    }))
}

/** QRep partition sync-progress table (first 12 partitions). */
export function QRepPartitions({
  partitions,
}: {
  partitions: QRepPartition[]
}) {
  const done = partitions.filter((p) => partitionState(p) === 'done').length
  const running = partitions.filter(
    (p) => partitionState(p) === 'running'
  ).length
  const queued = partitions.filter((p) => partitionState(p) === 'queued').length
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            QRep partitions
          </span>
          <span className="text-[11px] tabular-nums">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {done}
            </span>
            <span className="text-muted-foreground"> done</span>
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {running}
            </span>
            <span className="text-muted-foreground"> in flight</span>
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="font-semibold text-muted-foreground">
              {queued}
            </span>
            <span className="text-muted-foreground"> queued</span>
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="w-[44px] px-2.5 py-1.5">#</th>
              <th className="px-2.5 py-1.5">Partition UUID</th>
              <th className="w-[80px] px-2.5 py-1.5">Status</th>
              <th className="w-[88px] px-2.5 py-1.5 text-right">Duration</th>
              <th className="w-[102px] px-2.5 py-1.5 text-right">
                Start (UTC)
              </th>
              <th className="w-[102px] px-2.5 py-1.5 text-right">End (UTC)</th>
              <th className="w-[112px] px-2.5 py-1.5 text-right">
                Rows in partition
              </th>
              <th className="w-[100px] px-2.5 py-1.5 text-right">
                Rows synced
              </th>
              <th className="w-[130px] px-2.5 py-1.5">Progress</th>
            </tr>
          </thead>
          <tbody>
            {partitions.slice(0, 12).map((p, i) => {
              const st = partitionState(p)
              const tone = PART_TONE[st]
              const rowsIn = toNumber(p.rowsInPartition ?? p.numRows)
              const rowsSy = toNumber(p.rowsSynced)
              const pct = rowsIn
                ? Math.min(100, Math.max(0, (rowsSy / rowsIn) * 100))
                : 0
              const dur = durationMs(p.startTime, p.endTime ?? p.pullEndTime)
              const uuid = p.partitionId ?? ''
              return (
                <tr
                  key={uuid || i}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-2.5 py-1.5 font-mono tabular-nums text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span className="font-mono text-[10.5px]" title={uuid}>
                      {uuid.length > 20
                        ? `${uuid.slice(0, 14)}…${uuid.slice(-4)}`
                        : uuid}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10.5px] font-medium"
                      style={{ color: tone }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: tone }}
                      />
                      {st}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono tabular-nums">
                    {st === 'queued'
                      ? '—'
                      : pdbFmtDuration(dur ? dur / 1000 : 0)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                    {pdbFmtClock(p.startTime)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
                    {pdbFmtClock(p.endTime ?? p.pullEndTime)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono tabular-nums">
                    {pdbFmtNum(rowsIn)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono tabular-nums">
                    {pdbFmtNum(rowsSy)}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${pct}%`, background: tone }}
                        />
                      </div>
                      <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
