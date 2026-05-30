'use client'

import {
  BoxesIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  HashIcon,
  RefreshCwIcon,
  ShieldIcon,
  XIcon,
} from 'lucide-react'

import type { ClusterLiveMetricsRow } from '@/lib/query-config/system/cluster-live-metrics'
import type { ClusterTopologyRow } from '@/lib/query-config/system/clusters-topology'
import type { LiveSnapshot } from './inspector'
import type { KeeperInfoRow } from './model'

import {
  ChInspector,
  ClusterOverview,
  EMPTY_LIVE,
  KeeperInspector,
} from './inspector'
import { buildTopologyModel, isKeeperNode, STATUS_COLOR } from './model'
import { TopoCanvas } from './topo-canvas'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTableData } from '@/lib/swr'
import { cn } from '@/lib/utils'

// Refresh cadences: structure is slow-moving (cache hard), live is fast.
const STRUCTURE_INTERVAL = 60_000 // 60s
const STRUCTURE_DEDUPE = 55_000
const LIVE_INTERVAL = 8_000 // 8s
const HIST_LEN = 28

// ── summary pill ──
function Pill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  tone?: string
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3">
      <Icon className="h-[13px] w-[13px] text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-[12.5px] font-semibold tabular-nums',
          tone || 'text-foreground'
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function TopologyView({ hostId }: { hostId: number }) {
  // ── structural data (cached hard) ──
  const {
    data: clusterRows,
    error: clusterError,
    isLoading: clusterLoading,
    refresh: refreshClusters,
  } = useTableData<ClusterTopologyRow>(
    'clusters-topology',
    hostId,
    undefined,
    STRUCTURE_INTERVAL,
    {
      dedupingInterval: STRUCTURE_DEDUPE,
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  )

  // ── keeper data (optional; degrade gracefully) ──
  const { data: keeperRows, refresh: refreshKeeper } =
    useTableData<KeeperInfoRow>(
      'keeper-info',
      hostId,
      undefined,
      STRUCTURE_INTERVAL,
      {
        dedupingInterval: STRUCTURE_DEDUPE,
        keepPreviousData: true,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }
    )

  // ── live metrics for the connected node (fast interval, separate key) ──
  const { data: liveRows, refresh: refreshLive } =
    useTableData<ClusterLiveMetricsRow>(
      'cluster-live-metrics',
      hostId,
      undefined,
      LIVE_INTERVAL,
      {
        dedupingInterval: LIVE_INTERVAL - 1000,
        keepPreviousData: true,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }
    )

  // ── model: rebuilt ONLY when structural data changes ──
  const model = useMemo(
    () => buildTopologyModel(clusterRows ?? [], keeperRows ?? []),
    [clusterRows, keeperRows]
  )

  const liveRow = liveRows?.[0]

  // Identify the local CH node id (the connected node).
  const localNodeId = useMemo(
    () => model.chNodes.find((n) => n.isLocal)?.id ?? null,
    [model.chNodes]
  )

  // ── live history ring buffer (only the live bit re-renders) ──
  const [cpuHist, setCpuHist] = useState<number[]>([])
  const lastCpuRef = useRef<number | null>(null)
  useEffect(() => {
    const cpu = liveRow?.cpu_pct
    if (cpu === undefined || cpu === null) return
    const n = Number(cpu)
    if (!Number.isFinite(n)) return
    if (lastCpuRef.current === n && cpuHist.length > 0) return
    lastCpuRef.current = n
    setCpuHist((prev) => [...prev.slice(-(HIST_LEN - 1)), n])
  }, [liveRow?.cpu_pct, cpuHist.length])

  // Keeper latency history (avg across keepers).
  const [latHist, setLatHist] = useState<number[]>([])
  useEffect(() => {
    if (model.keepers.length === 0) return
    const avg =
      model.keepers.reduce((s, k) => s + k.avgLatency, 0) / model.keepers.length
    if (!Number.isFinite(avg) || avg <= 0) return
    setLatHist((prev) => [...prev.slice(-(HIST_LEN - 1)), avg])
  }, [model.keepers])

  // ── selection + cluster filter ──
  const [selected, setSelected] = useState<string | null>(null)
  const [activeCluster, setActiveCluster] = useState<string | null>(null)
  const [secsAgo, setSecsAgo] = useState(0)

  useEffect(() => {
    setSecsAgo(0)
  }, [liveRow])
  useEffect(() => {
    const t = setInterval(() => setSecsAgo((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // live numbers mapped to canvas glyph rings (local node only)
  const liveById = useMemo(() => {
    const map: Record<
      string,
      { cpuPct: number | null; memPct: number | null }
    > = {}
    if (localNodeId && liveRow) {
      const cpu = Number(liveRow.cpu_pct)
      const memUsed = Number(liveRow.mem_used_bytes)
      const memTotal = Number(liveRow.mem_total_bytes)
      map[localNodeId] = {
        cpuPct: Number.isFinite(cpu) ? cpu : null,
        memPct:
          Number.isFinite(memUsed) && memTotal > 0
            ? (memUsed / memTotal) * 100
            : null,
      }
    }
    return map
  }, [localNodeId, liveRow])

  // full live snapshot for the inspector (local node only)
  const localSnapshot: LiveSnapshot = useMemo(() => {
    if (!liveRow) return { ...EMPTY_LIVE, latHist }
    const numOrNull = (v: unknown) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }
    return {
      cpuPct: numOrNull(liveRow.cpu_pct),
      memUsed: numOrNull(liveRow.mem_used_bytes),
      memTotal: numOrNull(liveRow.mem_total_bytes),
      diskUsed: numOrNull(liveRow.disk_used_bytes),
      diskTotal: numOrNull(liveRow.disk_total_bytes),
      activeQueries: numOrNull(liveRow.active_queries),
      uptimeSeconds: numOrNull(liveRow.uptime_seconds),
      version: liveRow.version ?? null,
      cpuHist,
      latHist,
    }
  }, [liveRow, cpuHist, latHist])

  const selectedNode = selected ? (model.nodeById[selected] ?? null) : null

  const handleRefresh = () => {
    refreshClusters()
    refreshKeeper()
    refreshLive()
  }

  // ── loading / empty states ──
  if (clusterLoading && (!clusterRows || clusterRows.length === 0)) {
    return <TopologySkeleton />
  }

  if (clusterError && (!clusterRows || clusterRows.length === 0)) {
    return (
      <Card className="p-6">
        <p className="text-sm text-destructive">
          Failed to load cluster topology: {clusterError.message}
        </p>
      </Card>
    )
  }

  if (!clusterRows || clusterRows.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          No clusters found in system.clusters for this host.
        </p>
      </Card>
    )
  }

  const dfltCluster =
    model.clusters.find((c) => c.name === 'default')?.name ??
    model.clusters[0]?.name ??
    '—'
  const leaderLabel = model.leaderId ? `leader ${model.leaderId}` : '—'

  return (
    <div className="max-w-[1640px]">
      {/* status strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span
              className={cn(
                'absolute inset-0 rounded-full',
                model.quorumHealthy || model.keepers.length === 0
                  ? 'topo-live-dot bg-emerald-500'
                  : 'bg-amber-500'
              )}
            />
            <span
              className={cn(
                'relative h-2 w-2 rounded-full',
                model.quorumHealthy || model.keepers.length === 0
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              )}
            />
          </span>
          <span className="text-[12.5px] font-medium">
            {model.keepers.length === 0
              ? 'Cluster online'
              : model.quorumHealthy
                ? 'Quorum healthy · all replicas online'
                : 'Quorum degraded'}
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            · cluster <span className="font-mono">{dfltCluster}</span> · updated{' '}
            <span className="tabular-nums">{secsAgo}s</span> ago
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-[12px]"
            onClick={handleRefresh}
          >
            <RefreshCwIcon className="h-3 w-3" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 gap-1.5 px-2 text-[12px]"
          >
            <Link href={`/clusters?host=${hostId}`}>
              <ExternalLinkIcon className="h-3 w-3" />
              system.clusters
            </Link>
          </Button>
        </div>
      </div>

      {/* summary pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill icon={BoxesIcon} label="Nodes" value={model.counts.nodes} />
        <Pill
          icon={ShieldIcon}
          label="Keeper"
          value={`${model.counts.keepers} · ${leaderLabel}`}
        />
        <Pill
          icon={DatabaseIcon}
          label="ClickHouse"
          value={model.counts.chNodes}
        />
        <Pill
          icon={HashIcon}
          label="Clusters"
          value={`${model.counts.clusters} (${model.counts.physical} physical · ${model.counts.logical} logical)`}
        />
        {localSnapshot.activeQueries !== null && (
          <Pill
            icon={RefreshCwIcon}
            label="Active queries"
            value={localSnapshot.activeQueries}
            tone="text-amber-600 dark:text-amber-400"
          />
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[1fr_360px]">
        {/* canvas */}
        <Card className="overflow-hidden">
          {/* legend toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Clusters
              </span>
              {model.clusters.map((cl) => {
                const on = activeCluster === cl.id
                return (
                  <button
                    type="button"
                    key={cl.id}
                    onClick={() => setActiveCluster(on ? null : cl.id)}
                    className={cn(
                      'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors',
                      on
                        ? 'border-foreground/30 bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {cl.outline ? (
                      <span
                        className="h-2.5 w-2.5 rounded-sm border-2 border-dotted"
                        style={{ borderColor: cl.color }}
                      />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: cl.color }}
                      />
                    )}
                    <span className="font-mono">{cl.name}</span>
                  </button>
                )
              })}
              {activeCluster && (
                <button
                  type="button"
                  onClick={() => setActiveCluster(null)}
                  className="ml-1 text-[11px] text-muted-foreground underline hover:text-foreground"
                >
                  clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-0.5 w-4 rounded-full"
                  style={{ background: '#3b82f6', opacity: 0.6 }}
                />
                replication
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-4 border-t-2 border-dashed"
                  style={{
                    borderColor: 'hsl(var(--muted-foreground))',
                    opacity: 0.5,
                  }}
                />
                coordination
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                healthy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                warn
              </span>
            </div>
          </div>
          <div className="h-[480px] bg-background/40 sm:h-[540px]">
            <TopoCanvas
              model={model}
              liveById={liveById}
              selected={selected}
              activeCluster={activeCluster}
              onSelect={setSelected}
              onClearSelect={() => setSelected(null)}
            />
          </div>
        </Card>

        {/* inspector */}
        <Card className="overflow-hidden xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Inspector
              </div>
              <div className="mt-0.5 flex items-center gap-2 truncate text-[14px] font-semibold">
                {selectedNode ? (
                  <>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: isKeeperNode(selectedNode)
                          ? selectedNode.isLeader
                            ? STATUS_COLOR.warn
                            : STATUS_COLOR.healthy
                          : STATUS_COLOR[selectedNode.status],
                      }}
                    />
                    <span className="font-mono">{selectedNode.id}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {isKeeperNode(selectedNode) ? 'Keeper' : 'ClickHouse'}
                    </span>
                  </>
                ) : (
                  <span>Cluster overview</span>
                )}
              </div>
            </div>
            {selectedNode && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Close inspector"
              >
                <XIcon className="h-[15px] w-[15px]" />
              </button>
            )}
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {!selectedNode && (
              <ClusterOverview model={model} live={localSnapshot} />
            )}
            {selectedNode && !isKeeperNode(selectedNode) && (
              <ChInspector
                node={selectedNode}
                model={model}
                live={
                  selectedNode.isLocal
                    ? localSnapshot
                    : { ...EMPTY_LIVE, latHist }
                }
              />
            )}
            {selectedNode && isKeeperNode(selectedNode) && (
              <KeeperInspector
                node={selectedNode}
                model={model}
                live={localSnapshot}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function TopologySkeleton() {
  return (
    <div className="max-w-[1640px]">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-40" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-[540px] w-full rounded-xl" />
        <Skeleton className="h-[540px] w-full rounded-xl" />
      </div>
    </div>
  )
}
