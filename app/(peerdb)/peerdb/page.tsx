'use client'

import {
  ExternalLinkIcon,
  Maximize2Icon,
  NetworkIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import type { MirrorMetricsSummary } from '@/components/peerdb/mirror-row'
import type { ListMirrorsResponse, ListPeersResponse } from '@/lib/peerdb/types'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { KpiCard } from '@/components/peerdb/kpi-card'
import { MirrorRow } from '@/components/peerdb/mirror-row'
import { PeerGraph } from '@/components/peerdb/peer-graph'
import { PeerDBNotConfigured } from '@/components/peerdb/peerdb-not-configured'
import {
  DESIGN_STATUS_META,
  type DesignStatus,
  isPeerDBNotConfigured,
  pdbFmtNum,
  toDesignStatus,
} from '@/components/peerdb/peerdb-utils'
import { usePeerDBStatus } from '@/components/peerdb/use-peerdb-status'
import { usePeerDB } from '@/lib/swr'
import { cn } from '@/lib/utils'

const FILTERS: { k: DesignStatus | 'all'; label: string }[] = [
  { k: 'all', label: 'All' },
  { k: 'running', label: 'Running' },
  { k: 'snapshotting', label: 'Snapshot' },
  { k: 'paused', label: 'Paused' },
  { k: 'failed', label: 'Failed' },
]

/** Rows rendered before "Show more" — windows huge fleets so the DOM stays light. */
const PAGE_SIZE = 60

export default function PeerDBMirrorsPage() {
  const {
    data,
    error,
    isLoading: isLoadingMirrors,
    isValidating: isValidatingMirrors,
    refresh: refreshMirrors,
  } = usePeerDB<ListMirrorsResponse>('/mirrors/list', {
    refreshInterval: 60_000,
  })
  const {
    data: peersData,
    error: peersError,
    isLoading: isLoadingPeers,
    isValidating: isValidatingPeers,
    refresh: refreshPeers,
  } = usePeerDB<ListPeersResponse>('/peers/list', {
    refreshInterval: 120_000,
  })
  const {
    data: status,
    error: statusError,
    isLoading: isLoadingStatus,
    isValidating: isValidatingStatus,
    mutate: refreshStatus,
  } = usePeerDBStatus(120_000)

  const isRefreshing =
    isValidatingMirrors || isValidatingPeers || isValidatingStatus
  const isLoadingAny = isLoadingMirrors || isLoadingPeers || isLoadingStatus

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([refreshMirrors(), refreshPeers(), refreshStatus()])
    } catch {
      // SWR surfaces per-hook errors in the UI; swallow here so the manual
      // refresh click never produces an unhandled rejection.
    }
  }, [refreshMirrors, refreshPeers, refreshStatus])

  // Trigger sonner toast notifications on fetching errors
  useEffect(() => {
    if (error) {
      toast.error(`Mirrors API Error: ${error.message}`)
    }
  }, [error])

  useEffect(() => {
    if (peersError) {
      toast.error(`Peers API Error: ${peersError.message}`)
    }
  }, [peersError])

  useEffect(() => {
    if (statusError) {
      toast.error(`Connection Probe Error: ${statusError.message}`)
    }
  }, [statusError])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [graphOpen, setGraphOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [metrics, setMetrics] = useState<Record<string, MirrorMetricsSummary>>(
    {}
  )

  const onMetrics = useCallback((name: string, m: MirrorMetricsSummary) => {
    setMetrics((prev) => {
      const cur = prev[name]
      const sameTrend =
        cur &&
        cur.trend.length === m.trend.length &&
        cur.trend.every((v, i) => v === m.trend[i])
      if (
        cur &&
        cur.rowsPerSec === m.rowsPerSec &&
        cur.rowsSynced === m.rowsSynced &&
        sameTrend
      ) {
        return prev
      }
      return { ...prev, [name]: m }
    })
  }, [])

  const mirrors = useMemo(() => data?.mirrors ?? [], [data])
  const peers = useMemo(() => {
    const seen = new Map<
      string,
      NonNullable<ListPeersResponse['items']>[number]
    >()
    for (const p of [
      ...(peersData?.items ?? []),
      ...(peersData?.sourceItems ?? []),
      ...(peersData?.destinationItems ?? []),
    ]) {
      if (p?.name && !seen.has(p.name)) seen.set(p.name, p)
    }
    return Array.from(seen.values())
  }, [peersData])

  const counts = useMemo(() => {
    const c: Record<DesignStatus, number> = {
      running: 0,
      snapshotting: 0,
      paused: 0,
      failed: 0,
    }
    for (const m of mirrors) c[toDesignStatus(m.status)]++
    return c
  }, [mirrors])

  const totals = useMemo(() => {
    let rowsPerSec = 0
    let rowsSynced = 0
    let trendLen = 0
    let measured = 0
    for (const m of mirrors) {
      const v = metrics[m.name]
      if (!v) continue
      measured++
      rowsPerSec += v.rowsPerSec
      rowsSynced += v.rowsSynced
      trendLen = Math.max(trendLen, v.trend.length)
    }
    const aggTrend = Array.from({ length: trendLen }, (_, i) =>
      mirrors.reduce((a, m) => a + (metrics[m.name]?.trend[i] ?? 0), 0)
    )
    return { rowsPerSec, rowsSynced, aggTrend, measured }
  }, [mirrors, metrics])

  const filtered = useMemo(
    () =>
      mirrors.filter((m) => {
        if (statusFilter !== 'all' && toDesignStatus(m.status) !== statusFilter)
          return false
        if (
          search &&
          !`${m.name} ${m.sourceName ?? ''} ${m.destinationName ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false
        return true
      }),
    [mirrors, statusFilter, search]
  )

  // Reset the window whenever the filter/search changes. statusFilter/search
  // are intentional triggers (not read in the body), so the lint is silenced.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deliberate reset triggers
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [statusFilter, search])

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )

  if (isPeerDBNotConfigured(error)) {
    return <PeerDBNotConfigured />
  }

  // Small fleets eagerly load per-row metrics (full design); large fleets load
  // lazily on row expand so we don't fan out hundreds of PeerDB calls.
  const eagerMetrics = mirrors.length > 0 && mirrors.length <= 24

  const toggleRow = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const connected = status?.state === 'connected'
  const chipTone = connected
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
    : status?.state === 'auth'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
      : 'border-border bg-muted text-muted-foreground'
  const dotColor = connected
    ? '#10b981'
    : status?.state === 'auth'
      ? '#f59e0b'
      : '#94a3b8'

  return (
    <div className="max-w-[1640px] px-3 py-4 sm:px-4 sm:py-5 md:px-6">
      {/* header */}
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="text-[20px] font-bold tracking-tight sm:text-[22px]">
            PeerDB Mirrors
          </h1>
          <span className="ml-1 inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground">
            {mirrors.length} mirrors
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium',
              chipTone
            )}
            title={status?.error}
          >
            <span className="relative inline-flex">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: dotColor }}
              />
              {connected && (
                <span
                  className="absolute inset-0 animate-ping rounded-full"
                  style={{ background: dotColor, opacity: 0.6 }}
                />
              )}
            </span>
            PeerDB API ·{' '}
            <span className="font-mono tabular-nums">
              {status?.host ?? '—'}
            </span>
          </span>
          {isRefreshing && (
            <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Syncing in background...
            </span>
          )}
          <button
            type="button"
            onClick={refreshAll}
            disabled={isLoadingAny || isRefreshing}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[12px] font-medium text-foreground hover:bg-muted disabled:opacity-85 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCwIcon
              className={cn(
                'size-3',
                (isLoadingAny || isRefreshing) && 'animate-spin text-primary'
              )}
            />
            <span className="hidden sm:inline">
              {isLoadingAny || isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
          {status?.host && (
            <a
              href={`${status.host.includes('localhost') || status.host.startsWith('127.') ? 'http' : 'https'}://${status.host}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-[12px] font-medium text-foreground hover:bg-muted"
            >
              <ExternalLinkIcon className="size-3" />
              <span className="hidden sm:inline">Open PeerDB</span>
            </a>
          )}
        </div>
      </div>
      <p className="mb-4 text-[12.5px] text-muted-foreground">
        Replication mirrors with live status, rows-synced trend, and routing
        topology. Data sourced from{' '}
        <span className="font-mono">/v1/mirrors/list</span>.
      </p>

      {/* API connection error warning banner */}
      {(error || peersError || statusError) && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive flex flex-wrap gap-2 items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-destructive/20 px-1.5 py-0.5 rounded mr-1">
              Connection Alert
            </span>
            <span className="font-medium text-left">
              {error?.message || peersError?.message || statusError?.message}
            </span>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            className="rounded border border-destructive/30 bg-background hover:bg-muted px-2.5 py-1 text-[11.5px] font-medium text-foreground transition-all flex items-center gap-1 shadow-sm shrink-0"
          >
            <RefreshCwIcon className="size-3" />
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Running"
          value={counts.running}
          dotColor={DESIGN_STATUS_META.running.dot}
          pulse
          sub="CDC active"
          sparkData={totals.aggTrend}
          sparkColor={DESIGN_STATUS_META.running.dot}
        />
        <KpiCard
          label="Snapshotting"
          value={counts.snapshotting}
          dotColor={DESIGN_STATUS_META.snapshotting.dot}
          pulse
          sub="QRep + initial"
        />
        <KpiCard
          label="Paused"
          value={counts.paused}
          dotColor={DESIGN_STATUS_META.paused.dot}
          sub="user / auto"
        />
        <KpiCard
          label="Failed"
          value={counts.failed}
          dotColor={DESIGN_STATUS_META.failed.dot}
          sub="needs attention"
          accent={counts.failed > 0 ? DESIGN_STATUS_META.failed.dot : undefined}
        />
        <KpiCard
          label="Throughput"
          value={pdbFmtNum(totals.rowsPerSec)}
          sub={
            eagerMetrics
              ? 'rows/s · all mirrors'
              : `rows/s · ${totals.measured}/${mirrors.length} loaded`
          }
          dotColor="#6366f1"
          sparkData={totals.aggTrend}
          sparkColor="#6366f1"
        />
        <KpiCard
          label="Rows synced"
          value={pdbFmtNum(totals.rowsSynced)}
          sub={
            eagerMetrics
              ? 'cumulative all-time'
              : `cumulative · ${totals.measured}/${mirrors.length} loaded`
          }
        />
      </div>

      {/* topology card */}
      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <NetworkIcon className="size-3.5 text-muted-foreground" />
            <h2 className="text-[13px] font-semibold">Peer topology</h2>
            <span className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground">
              {peers.length} peers
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              live flow visualization
            </span>
          </div>
          <button
            type="button"
            onClick={() => setGraphOpen((v) => !v)}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Maximize2Icon className="size-3" />
            {graphOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {graphOpen && (
          <div className="p-4">
            <PeerGraph peers={peers} mirrors={mirrors} className="h-[420px]" />
          </div>
        )}
      </div>

      {/* mirror table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
          <div className="flex h-8 min-w-[200px] max-w-[360px] flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2.5">
            <SearchIcon className="size-3 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mirror, source, destination…"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[12px] text-muted-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
            {FILTERS.map((o) => {
              const count =
                o.k === 'all' ? mirrors.length : counts[o.k as DesignStatus]
              const on = statusFilter === o.k
              return (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setStatusFilter(o.k)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-[11.5px] font-medium',
                    on
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  {o.label}
                  <span className="rounded px-1 text-[10px] tabular-nums text-muted-foreground/70">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex-1" />
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ tableLayout: 'fixed' }}
          >
            <colgroup>
              <col style={{ width: '230px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '92px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '88px' }} />
              <col style={{ width: '92px' }} />
              <col />
              <col style={{ width: '90px' }} />
            </colgroup>
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left">Mirror</th>
                <th className="hidden px-3 py-2 text-left md:table-cell">
                  Source
                </th>
                <th className="hidden px-1 py-2 text-center md:table-cell">
                  Type
                </th>
                <th className="hidden px-3 py-2 text-left md:table-cell">
                  Destination
                </th>
                <th className="hidden px-3 py-2 text-right lg:table-cell">
                  Lag
                </th>
                <th className="hidden px-3 py-2 text-right lg:table-cell">
                  Rows/s
                </th>
                <th className="px-3 py-2 text-right">Rows synced (trend)</th>
                <th className="hidden px-3 py-2 text-right xl:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <MirrorRow
                  key={m.name}
                  mirror={m}
                  expanded={expanded.has(m.name)}
                  onToggle={() => toggleRow(m.name)}
                  loadMetrics={eagerMetrics}
                  onMetrics={onMetrics}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-[13px] text-muted-foreground"
                  >
                    No mirrors match your filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {visible.length < filtered.length && (
          <div className="border-t border-border px-3 py-2 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
            >
              Show {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
              mirrors
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-[11.5px] text-muted-foreground">
          <div>
            Showing{' '}
            <span className="font-medium tabular-nums text-foreground">
              {visible.length}
            </span>{' '}
            of {filtered.length}
            {filtered.length !== mirrors.length
              ? ` (filtered from ${mirrors.length})`
              : ''}{' '}
            mirrors
          </div>
          <div className="flex items-center gap-2">
            <RefreshCwIcon className="size-3" />
            <span>Auto-refresh · every 60s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
