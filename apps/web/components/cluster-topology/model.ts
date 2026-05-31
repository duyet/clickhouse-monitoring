/**
 * Build the topology model from REAL ClickHouse data.
 *
 * The model is assembled in two stages so the same logic runs on the server
 * (the /api/v1/cluster-topology route) and the client:
 *
 *  - `assembleTopology(...)` — pure, layout-free. Takes raw rows from
 *    `clusters-topology` (system.clusters), `keeper-info` (system.zookeeper_info,
 *    optional), `keeper-presence` (system.zookeeper_connection, optional), and an
 *    optional all-node live snapshot. Produces a deterministic `TopologyData`
 *    (nodes, clusters, edges, keeper, meta, per-node live metrics) with NO x/y.
 *    This is what the server route serializes to JSON.
 *
 *  - `layoutTopology(data)` — pure. Adds deterministic x/y coordinates so the
 *    SVG canvas + inspector can render. Stable across live-metric ticks.
 *
 * `buildTopologyModel(...)` composes both for callers that want a fully-laid-out
 * model from raw rows (the client fallback when the API route is unavailable).
 *
 * RESILIENCE: structural truth always comes from system.clusters (local, always
 * available). Live numbers come from the best-effort cluster fan-out. A node that
 * is in system.clusters but absent from the live snapshot is `unreachable` with
 * NULL metrics — never fabricated zeros.
 */

import type { ClusterTopologyRow } from '@/lib/query-config/system/clusters-topology'

import { roundedRectPath } from './geometry'

export interface NodeLiveMetrics {
  cpuPct: number | null
  memUsed: number | null
  memTotal: number | null
  memAvailable: number | null
  diskUsed: number | null
  diskTotal: number | null
  activeQueries: number | null
  uptimeSeconds: number | null
  version: string | null
}

export type KeeperRole =
  | 'leader'
  | 'follower'
  | 'observer'
  | 'standalone'
  | 'unknown'

export interface KeeperNode {
  id: string
  host: string
  port: number
  role: KeeperRole
  isLeader: boolean
  version: string
  avgLatency: number
  znodeCount: number
  watchCount: number
  outstanding: number
  isConnected: boolean
  clusterName: string
  x: number
  y: number
}

export type ChStatus = 'healthy' | 'warn' | 'down' | 'unreachable'

export interface ChNode {
  id: string
  host: string
  address: string
  port: number
  isLocal: boolean
  /** healthy | warn | down | unreachable — derived from errors/active/live, never random */
  status: ChStatus
  errors: number
  slowdowns: number
  recoveryTime: number
  isActive: number | null
  /** Replicated-DB replica lag (24.10+), null otherwise */
  replicationLag: number | null
  /** ClickHouse version, from the live fan-out (null when not reachable) */
  version: string | null
  /** live metrics for this node (null fields when not reachable / not permitted) */
  live: NodeLiveMetrics | null
  /** default-cluster shard/replica role, if present */
  defaultRole?: { s: number; r: number }
  x: number
  y: number
}

export interface ClusterInfo {
  id: string
  name: string
  kind: 'physical' | 'logical'
  color: string
  topo: string
  /** members keyed by node id → shard/replica role */
  members: Record<string, { s: number; r: number }>
  /** rendered as a dotted outline (physical default cluster) instead of a filled hull */
  outline: boolean
  nodeCount: number
  /** true when any shard has >1 replica → draw replication edges between replicas. */
  replicated: boolean
}

/**
 * Precomputed cluster overlay: an offset-convex-hull path plus the metadata the
 * canvas needs to draw it (color, border style, area for z-ordering, label
 * anchor). Pure function of structure + layout → stable across live ticks.
 */
export interface ClusterHull {
  id: string
  name: string
  color: string
  /** physical cluster → dotted outline (no fill); logical/virtual → dashed border + fill. */
  outline: boolean
  /** the single closed SVG path (circle / stadium / rounded polygon). */
  d: string
  /** Minkowski-sum area, used to z-order: largest drawn first (behind). */
  area: number
  /** label anchor near the blob's top edge. */
  labelX: number
  labelY: number
}

export type KeeperSource = 'keeper' | 'zookeeper' | 'none'

export interface KeeperSummary {
  present: boolean
  source: KeeperSource
  leaderId: string | null
  quorumHealthy: boolean
}

export interface TopologyMeta {
  counts: {
    nodes: number
    keepers: number
    chNodes: number
    clusters: number
    physical: number
    logical: number
  }
  /** true when the node list was capped for rendering (large clusters) */
  truncated: boolean
  /** number of CH nodes hidden by the render cap */
  hiddenChNodes: number
  /** how the live snapshot was obtained: full fan-out, local-only fallback, or none */
  liveSource: 'fanout' | 'local' | 'none'
}

/** Layout-free structural model — the server-route wire shape. */
export interface TopologyData {
  keepers: KeeperNode[]
  chNodes: ChNode[]
  clusters: ClusterInfo[]
  raftEdges: [string, string][]
  replEdges: [string, string][]
  coordEdges: [string, string][]
  keeper: KeeperSummary
  meta: TopologyMeta
}

export interface TopologyModel extends TopologyData {
  nodeById: Record<string, KeeperNode | ChNode>
  clusterById: Record<string, ClusterInfo>
  /** cluster overlays, sorted by area DESCENDING (largest first / behind). */
  clusterHulls: ClusterHull[]
  keeperHull: string
  /** mirror of keeper.leaderId for existing consumers */
  leaderId: string | null
  /** mirror of keeper.quorumHealthy for existing consumers */
  quorumHealthy: boolean
  counts: TopologyMeta['counts']
}

/** Type guard: is this node a Keeper (vs a ClickHouse node)? */
export function isKeeperNode(n: KeeperNode | ChNode): n is KeeperNode {
  return 'role' in n
}

// Canvas viewBox. WIDE aspect so it fills the xl two-column container instead of
// letterboxing horizontally — the "relax the space" ask. The extra height leaves
// room for each node's labels to sit INSIDE its cluster boundary.
// Imported by the layout tests, so the in-viewBox bounds check moves with them.
export const VB_W = 1280
export const VB_H = 580
// Node radii are exported so the canvas glyphs render at exactly the size the
// layout reserves spacing/hull padding for — no drift between layout and paint.
// Sized so a typical hostname fits INSIDE the glyph (square card / hexagon).
export const CH_R = 42
export const KP_R = 40

// Cap CH nodes drawn on the canvas so large clusters stay readable. The full
// structural truth is preserved in meta.counts / meta.hiddenChNodes.
export const CH_RENDER_CAP = 24

// Per-node CONTENT envelope (relative to the node center). A cluster boundary is
// the bounding box of its members' envelopes, so every node AND its labels sit
// inside the boundary.
//
// CONTRACT: these extents MUST track the label positions painted in
// topo-canvas.tsx (`NodeLabel`'s `r + 16` / `r + 31`, the LOCAL badge's
// `r + 25` / `r + 40`). If you move/resize a label in the canvas, update the
// matching extent here or the label spills outside its cluster rect. The numbers
// below decompose as: glyph radius (CH_R/KP_R) + label offset + line/badge height
// + a small descender allowance. See docs/knowledge/cluster-topology.md.
const ENVELOPE_MARGIN = 9 // breathing room between content and the boundary

/** How far a ClickHouse glyph + its labels extend below its center. */
function chDownExtent(n: ChNode): number {
  const showHost = n.host !== n.id || n.id.length > 12
  // sub-line at r+(16|31); LOCAL badge (local node) adds another ~17 below that.
  if (n.isLocal) return CH_R + (showHost ? 57 : 42)
  return CH_R + (showHost ? 36 : 21)
}
const chUpExtent = () => CH_R + 8
// Sub-line can be wider than the card (e.g. "cpu 99% · mem 99%"); clear it.
const chHalfExtent = () => CH_R + 34

/** Keeper hexagon + its labels. Leader has a star above; sub-line below. */
const keeperUpExtent = (k: KeeperNode) => KP_R + (k.isLeader ? 22 : 8)
const keeperDownExtent = () => KP_R + 22
const keeperHalfExtent = () => KP_R + 16

export const STATUS_COLOR: Record<string, string> = {
  healthy: '#10b981',
  warn: '#f59e0b',
  down: '#f43f5e',
  unreachable: '#94a3b8',
}

// Stable palette for logical clusters (default/physical is always slate).
const CLUSTER_PALETTE = [
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#ef4444',
]
const PHYSICAL_COLOR = '#64748b'

/** Keeper-info raw row shape (subset of keeper-info columns we use). */
export interface KeeperInfoRow {
  zookeeper_cluster_name?: string
  host: string
  port: number
  is_connected: number | boolean
  server_state?: string
  is_leader: number | boolean
  version?: string
  avg_latency?: number
  znode_count?: number
  watch_count?: number
  outstanding_requests?: number
}

/** keeper-presence raw row shape (system.zookeeper_connection). */
export interface KeeperPresenceRow {
  name?: string
  host?: string
  port?: number
  is_expired?: number | boolean
  enabled_feature_flags?: string[] | null
}

/** Live fan-out raw row shape (cluster-live-metrics-all / cluster-live-metrics). */
export interface ClusterLiveRow {
  hostname?: string
  cpu_pct?: number | string
  mem_used_bytes?: number | string
  mem_total_bytes?: number | string
  mem_available_bytes?: number | string
  disk_used_bytes?: number | string
  disk_total_bytes?: number | string
  active_queries?: number | string
  uptime_seconds?: number | string
  version?: string
}

const num = (v: unknown, d = 0): number => {
  const n = typeof v === 'string' ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : d
}
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const truthy = (v: unknown): boolean => v === 1 || v === true || v === '1'

function deriveKeeperRole(
  isLeader: boolean,
  serverState: string | undefined,
  count: number
): KeeperRole {
  if (isLeader) return 'leader'
  const s = serverState?.toLowerCase()
  if (s === 'leader') return 'leader'
  if (s === 'follower') return 'follower'
  if (s === 'standalone') return 'standalone'
  // observers / learners replicate but never vote — keep them out of quorum math.
  if (s === 'observer' || s === 'learner') return 'observer'
  return count === 1 ? 'standalone' : 'follower'
}

/** Short, stable id for a host (last hostname label or the address). */
function shortId(host: string, index: number): string {
  const label = host.split('.')[0] || host
  return label || `node-${index}`
}

function isPhysicalName(name: string): boolean {
  // Heuristic: the implicit per-server clusters and the conventional defaults are
  // "physical"; everything else is treated as a logical/virtual cluster.
  return (
    name === 'default' ||
    name.startsWith('default') ||
    name === 'all-replicated' ||
    name === 'all-sharded'
  )
}

/**
 * A cluster row is part of a Replicated-DATABASE (managed/logical) cluster when
 * it carries the database_* shard/replica names or any of the Replicated-DB
 * health columns (is_active / replication_lag / recovery_time) are non-NULL.
 */
function isReplicatedDbRow(r: ClusterTopologyRow): boolean {
  return (
    !!r.database_shard_name ||
    !!r.database_replica_name ||
    (r.is_active !== null && r.is_active !== undefined) ||
    (r.replication_lag !== null && r.replication_lag !== undefined) ||
    (r.recovery_time !== null && r.recovery_time !== undefined)
  )
}

/**
 * Detect the coordination layer source from the presence/info rows.
 *  - keeper-info rows present → use them (richest).
 *  - presence rows present → coordination reachable; embedded Keeper vs external
 *    ZK is a soft hint from enabled_feature_flags / port.
 *  - neither → none.
 */
function detectKeeperSource(
  keeperRows: KeeperInfoRow[],
  presenceRows: KeeperPresenceRow[]
): KeeperSource {
  const hasInfo = keeperRows.some((r) => r?.host)
  const hasPresence = presenceRows.some((r) => r?.host)
  if (!hasInfo && !hasPresence) return 'none'
  // embedded Keeper exposes feature flags (25.1+) and defaults to port 9181.
  const embedded = presenceRows.some(
    (r) =>
      (Array.isArray(r.enabled_feature_flags) &&
        r.enabled_feature_flags.length > 0) ||
      num(r.port) === 9181
  )
  if (embedded) return 'keeper'
  // external ZooKeeper defaults to 2181, no feature flags.
  const external = presenceRows.some((r) => num(r.port) === 2181)
  if (external) return 'zookeeper'
  // info rows but no clear hint: default to keeper (system.zookeeper_info is
  // ClickHouse-Keeper-specific).
  return hasInfo ? 'keeper' : 'zookeeper'
}

/**
 * Assemble the layout-free structural topology from raw ClickHouse rows.
 * Pure — safe to run server-side.
 */
export function assembleTopology(
  clusterRows: ClusterTopologyRow[],
  keeperRows: KeeperInfoRow[],
  presenceRows: KeeperPresenceRow[] = [],
  liveRows: ClusterLiveRow[] = [],
  liveSource: TopologyMeta['liveSource'] = 'none'
): TopologyData {
  // ── 1. collect unique CH hosts across all clusters ──
  // A host key combines name+port so the same machine in multiple clusters maps
  // to ONE node (the overlapping-hull story).
  const hostKey = (r: { host_name: string; port: number }) =>
    `${r.host_name}:${r.port}`

  const hostOrder: string[] = []
  const hostMeta = new Map<
    string,
    {
      row: ClusterTopologyRow
      errors: number
      slowdowns: number
      replicationLag: number | null
    }
  >()

  for (const r of clusterRows) {
    const k = hostKey(r)
    if (!hostMeta.has(k)) {
      hostOrder.push(k)
      hostMeta.set(k, {
        row: r,
        errors: num(r.errors_count),
        slowdowns: num(r.slowdowns_count),
        replicationLag: numOrNull(r.replication_lag),
      })
    } else {
      const m = hostMeta.get(k)!
      m.errors += num(r.errors_count)
      m.slowdowns += num(r.slowdowns_count)
      const lag = numOrNull(r.replication_lag)
      if (lag !== null) m.replicationLag = Math.max(m.replicationLag ?? 0, lag)
      if (truthy(r.is_local)) m.row = r
    }
  }

  // ── live metrics, keyed by hostname so we can left-join structure ← live ──
  const liveByHost = new Map<string, NodeLiveMetrics>()
  for (const lr of liveRows) {
    const host = lr.hostname
    if (!host) continue
    liveByHost.set(host, {
      cpuPct: numOrNull(lr.cpu_pct),
      memUsed: numOrNull(lr.mem_used_bytes),
      memTotal: numOrNull(lr.mem_total_bytes),
      memAvailable: numOrNull(lr.mem_available_bytes),
      diskUsed: numOrNull(lr.disk_used_bytes),
      diskTotal: numOrNull(lr.disk_total_bytes),
      activeQueries: numOrNull(lr.active_queries),
      uptimeSeconds: numOrNull(lr.uptime_seconds),
      version: lr.version ?? null,
    })
  }
  // A live fan-out can match by host_name OR resolved host_address. Build both keys.
  const matchLive = (row: ClusterTopologyRow): NodeLiveMetrics | undefined =>
    liveByHost.get(row.host_name) ?? liveByHost.get(row.host_address)

  const idByHostKey = new Map<string, string>()
  const chNodes: ChNode[] = hostOrder.map((k, i) => {
    const { row, errors, slowdowns, replicationLag } = hostMeta.get(k)!
    const id = shortId(row.host_name, i)
    idByHostKey.set(k, id)
    const isActive = row.is_active
    const inactive =
      isActive !== null && isActive !== undefined && !truthy(isActive)
    const live = matchLive(row) ?? null
    // status precedence: down (is_active=0) → warn (errors) →
    // unreachable (expected by fan-out but no live row) → healthy.
    let status: ChStatus
    if (inactive) {
      status = 'down'
    } else if (errors > 0) {
      status = 'warn'
    } else if (liveSource === 'fanout' && !live) {
      status = 'unreachable'
    } else {
      status = 'healthy'
    }
    return {
      id,
      host: row.host_name,
      address: row.host_address,
      port: num(row.port),
      isLocal: truthy(row.is_local),
      status,
      errors,
      slowdowns,
      recoveryTime: num(row.estimated_recovery_time),
      isActive: isActive ?? null,
      replicationLag,
      version: live?.version ?? null,
      live,
      x: 0,
      y: 0,
    }
  })

  // ── 2. build clusters with per-node shard/replica role ──
  const clusterNames: string[] = []
  const clusterMembers = new Map<
    string,
    Record<string, { s: number; r: number }>
  >()
  const clusterShards = new Map<string, Set<number>>()
  const clusterReplicas = new Map<string, Set<number>>()
  const clusterReplicatedDb = new Map<string, boolean>()

  for (const r of clusterRows) {
    const id = idByHostKey.get(hostKey(r))
    if (!id) continue
    if (!clusterMembers.has(r.cluster)) {
      clusterNames.push(r.cluster)
      clusterMembers.set(r.cluster, {})
      clusterShards.set(r.cluster, new Set())
      clusterReplicas.set(r.cluster, new Set())
      clusterReplicatedDb.set(r.cluster, false)
    }
    clusterMembers.get(r.cluster)![id] = {
      s: num(r.shard_num),
      r: num(r.replica_num),
    }
    clusterShards.get(r.cluster)!.add(num(r.shard_num))
    clusterReplicas.get(r.cluster)!.add(num(r.replica_num))
    if (isReplicatedDbRow(r)) clusterReplicatedDb.set(r.cluster, true)
  }

  let paletteIdx = 0
  const clusters: ClusterInfo[] = clusterNames.map((name) => {
    const members = clusterMembers.get(name)!
    const shards = clusterShards.get(name)!.size
    // A Replicated-DB cluster is always logical regardless of name; otherwise
    // fall back to the name heuristic.
    const physical = !clusterReplicatedDb.get(name) && isPhysicalName(name)
    // replicas-per-shard: max replica_num seen
    const maxR = Math.max(...clusterReplicas.get(name)!, 1)
    const color = physical
      ? PHYSICAL_COLOR
      : CLUSTER_PALETTE[paletteIdx++ % CLUSTER_PALETTE.length]
    return {
      id: name,
      name,
      kind: physical ? 'physical' : 'logical',
      color,
      topo: `${shards} shard${shards === 1 ? '' : 's'} × ${maxR} replica${maxR === 1 ? '' : 's'}`,
      members,
      outline: physical,
      nodeCount: Object.keys(members).length,
      replicated: maxR > 1,
    }
  })

  // attach default-cluster role to each CH node for the inspector identity row
  const defaultCluster =
    clusters.find((c) => c.name === 'default') ??
    clusters.find((c) => c.outline)
  if (defaultCluster) {
    for (const n of chNodes) {
      const role = defaultCluster.members[n.id]
      if (role) n.defaultRole = role
    }
  }

  // ── 3. keepers ──
  const presenceClean = presenceRows.filter((r) => r?.host)
  const keeperRowsClean = keeperRows.filter((r) => r?.host)
  const source = detectKeeperSource(keeperRowsClean, presenceClean)

  // Prefer the rich keeper-info rows. When absent but presence rows exist (e.g.
  // ClickHouse < 26.1, or external ZooKeeper), synthesize nodes from presence
  // rows with role 'unknown' and null raft indices — never fabricate roles.
  const hasInfo = keeperRowsClean.length > 0
  const keepers: KeeperNode[] = hasInfo
    ? keeperRowsClean.map((r, i) => {
        const isLeader = truthy(r.is_leader)
        const connected =
          r.is_connected === undefined ? true : truthy(r.is_connected)
        const role = deriveKeeperRole(
          isLeader,
          r.server_state,
          keeperRowsClean.length
        )
        return {
          id: shortId(r.host, i) || `kpr-${i + 1}`,
          host: r.host,
          port: num(r.port, 9181),
          role,
          isLeader,
          version: r.version ?? '—',
          avgLatency: num(r.avg_latency),
          znodeCount: num(r.znode_count),
          watchCount: num(r.watch_count),
          outstanding: num(r.outstanding_requests),
          isConnected: connected,
          clusterName: r.zookeeper_cluster_name ?? 'keeper',
          x: 0,
          y: 0,
        }
      })
    : presenceClean.map((r, i) => ({
        id: shortId(r.host!, i) || `kpr-${i + 1}`,
        host: r.host!,
        port: num(r.port, source === 'zookeeper' ? 2181 : 9181),
        role: 'unknown' as KeeperRole,
        isLeader: false,
        version: '—',
        avgLatency: 0,
        znodeCount: 0,
        watchCount: 0,
        outstanding: 0,
        // is_expired=1 means a degraded/dropped session.
        isConnected: !truthy(r.is_expired),
        clusterName: r.name ?? source,
        x: 0,
        y: 0,
      }))

  const hasExplicitLeader = keepers.some((k) => k.isLeader)
  // Prefer the explicit leader; if none is reported on a single standalone node,
  // anchor on it; multi-node with no leader → null (election / split-brain).
  const leaderId =
    keepers.find((k) => k.isLeader)?.id ??
    (hasExplicitLeader
      ? null
      : keepers.length === 1
        ? (keepers[0]?.id ?? null)
        : null)
  // Voting members exclude observers/learners.
  const voters = keepers.filter((k) => k.role !== 'observer')
  const quorumHealthy =
    keepers.length > 0 &&
    keepers.every((k) => k.isConnected) &&
    (voters.some((k) => k.isLeader) ||
      (voters.length === 1 && voters[0].role === 'standalone'))

  // ── 4. edges ──
  // Raft: full mesh among VOTING keepers (small N); observers link to the leader only.
  const raftEdges: [string, string][] = []
  for (let i = 0; i < voters.length; i++) {
    for (let j = i + 1; j < voters.length; j++) {
      raftEdges.push([voters[i].id, voters[j].id])
    }
  }
  if (leaderId) {
    for (const k of keepers) {
      if (k.role === 'observer') raftEdges.push([leaderId, k.id])
    }
  }
  // Coordination: every CH node ↔ keeper leader (dashed).
  const coordEdges: [string, string][] =
    leaderId && keepers.length > 0
      ? chNodes.map((n) => [n.id, leaderId] as [string, string])
      : []
  // Replication: only for REPLICATED clusters. Within each shard, link
  // consecutive replicas. Sharded/distributed clusters get no inter-shard edges.
  const replSet = new Set<string>()
  const replEdges: [string, string][] = []
  for (const c of clusters) {
    if (!c.replicated) continue
    const byShard = new Map<number, string[]>()
    for (const [id, role] of Object.entries(c.members)) {
      if (!byShard.has(role.s)) byShard.set(role.s, [])
      byShard.get(role.s)!.push(id)
    }
    for (const ids of byShard.values()) {
      for (let i = 0; i < ids.length - 1; i++) {
        const a = ids[i]
        const b = ids[i + 1]
        const key = [a, b].sort().join('~')
        if (a !== b && !replSet.has(key)) {
          replSet.add(key)
          replEdges.push([a, b])
        }
      }
    }
  }

  return {
    keepers,
    chNodes,
    clusters,
    raftEdges,
    replEdges,
    coordEdges,
    keeper: {
      present: source !== 'none',
      source,
      leaderId,
      quorumHealthy,
    },
    meta: {
      counts: {
        nodes: keepers.length + chNodes.length,
        keepers: keepers.length,
        chNodes: chNodes.length,
        clusters: clusters.length,
        physical: clusters.filter((c) => c.kind === 'physical').length,
        logical: clusters.filter((c) => c.kind === 'logical').length,
      },
      truncated: false,
      hiddenChNodes: 0,
      liveSource,
    },
  }
}

/**
 * Add deterministic x/y layout + lookup maps + hull to a TopologyData, producing
 * the model the SVG canvas + inspector consume. Pure & stable across live ticks.
 *
 * For very large clusters the rendered CH-node set is capped (the local node is
 * always kept) so the fixed viewBox stays readable; meta.truncated /
 * meta.hiddenChNodes report what was hidden. Edges referencing hidden nodes are
 * dropped by the canvas (it skips edges whose endpoints are missing).
 */
export function layoutTopology(data: TopologyData): TopologyModel {
  // Render cap: keep the local node + the first CH_RENDER_CAP nodes.
  let chNodes = data.chNodes
  let truncated = data.meta.truncated
  let hiddenChNodes = data.meta.hiddenChNodes
  if (chNodes.length > CH_RENDER_CAP) {
    const local = chNodes.filter((n) => n.isLocal)
    const rest = chNodes.filter((n) => !n.isLocal)
    const keepCount = Math.max(0, CH_RENDER_CAP - local.length)
    chNodes = [...local, ...rest.slice(0, keepCount)]
    truncated = true
    hiddenChNodes = data.chNodes.length - chNodes.length
  }

  // Clone so layout mutation does not affect the source data.
  const keepers = data.keepers.map((k) => ({ ...k }))
  const renderCh = chNodes.map((n) => ({ ...n }))

  layoutKeepers(keepers)
  layoutChNodes(renderCh, data.clusters)

  // Prevent overlap: push apart any nodes closer than the minimum spacing.
  // Wide gaps so a single-node cluster boundary can't reach a neighbor glyph
  // and labels never collide.
  enforceMinDistance(keepers, KP_R * 2 + 48)
  enforceMinDistance(renderCh, CH_R * 2 + 92)

  // Re-clamp after collision avoidance (repulsion can push nodes outside bounds).
  clampToBand(renderCh)

  // Auto-layout: translate the whole composition so its content (every node +
  // its labels) is centered in the draw area. This handles the no-keeper case
  // and any sparse layout — content sits in the middle instead of a fixed band.
  centerContent(keepers, renderCh)

  const nodeById: Record<string, KeeperNode | ChNode> = {}
  keepers.forEach((k) => {
    nodeById[k.id] = k
  })
  renderCh.forEach((n) => {
    nodeById[n.id] = n
  })
  const clusterById: Record<string, ClusterInfo> = {}
  data.clusters.forEach((c) => {
    clusterById[c.id] = c
  })

  const renderedIds = new Set(renderCh.map((n) => n.id))

  // Cluster overlays: offset convex hulls, z-ordered by area DESC, label-nudged.
  const clusterHulls = buildClusterHulls(data.clusters, nodeById, renderedIds)

  // Keeper quorum region over VOTING keepers (observers excluded): a rounded
  // rectangle whose envelope encloses every keeper glyph + its label. Absent → ''.
  const voters = keepers.filter((k) => k.role !== 'observer')
  const keeperHull = voters.length >= 1 ? buildKeeperRect(voters) : ''

  return {
    ...data,
    keepers,
    chNodes: renderCh,
    nodeById,
    clusterById,
    raftEdges: data.raftEdges,
    replEdges: data.replEdges,
    coordEdges: data.coordEdges,
    clusterHulls,
    keeperHull,
    leaderId: data.keeper.leaderId,
    quorumHealthy: data.keeper.quorumHealthy,
    counts: data.meta.counts,
    meta: { ...data.meta, truncated, hiddenChNodes },
  }
}

/**
 * Compose assemble + layout for callers holding raw rows (client fallback when
 * the API route is unavailable). Live metrics default to none.
 */
export function buildTopologyModel(
  clusterRows: ClusterTopologyRow[],
  keeperRows: KeeperInfoRow[],
  presenceRows: KeeperPresenceRow[] = [],
  liveRows: ClusterLiveRow[] = [],
  liveSource: TopologyMeta['liveSource'] = 'none'
): TopologyModel {
  return layoutTopology(
    assembleTopology(
      clusterRows,
      keeperRows,
      presenceRows,
      liveRows,
      liveSource
    )
  )
}

/** Keeper quorum: a horizontal triangle near the top (leader centered above). */
function layoutKeepers(keepers: KeeperNode[]) {
  const n = keepers.length
  if (n === 0) return
  const cx = VB_W / 2
  if (n === 1) {
    keepers[0].x = cx
    keepers[0].y = 120
    return
  }
  // leader on top apex, followers spread on a lower row
  const leaderIdx = Math.max(
    0,
    keepers.findIndex((k) => k.isLeader)
  )
  const followers = keepers.filter((_, i) => i !== leaderIdx)
  keepers[leaderIdx].x = cx
  keepers[leaderIdx].y = 100
  const spread = Math.min(170, 110 + followers.length * 14)
  const total = (followers.length - 1) * spread
  followers.forEach((f, i) => {
    f.x = cx - total / 2 + i * spread
    f.y = 198
  })
}

// CH region: a band below the keepers. Layout is deterministic + seeded only by
// structure so positions are stable across live ticks. The band leaves headroom
// below for each node's two label lines + LOCAL badge (≈ CH_R + 46).
const CH_BAND_Y = 340
const CH_BAND_H = 120
const CH_MARGIN = 170

/**
 * ClickHouse node layout that makes overlapping clusters legible:
 *  - group nodes by which DRAWABLE (logical/virtual) clusters they belong to;
 *  - give each logical cluster a centroid slot along a horizontal band;
 *  - place a node at the AVERAGE of its clusters' centroids, so a host shared by
 *    two clusters lands on the boundary between them → their hulls intersect in
 *    a small intentional lens (the ch-03 story);
 *  - spread nodes inside the same group on a compact grid so glyphs don't stack.
 *
 * Falls back to the simple centered arc / multi-row grid when there are no
 * logical clusters (e.g. only the implicit `default` cluster).
 */
function layoutChNodes(nodes: ChNode[], clusters: ClusterInfo[]) {
  const n = nodes.length
  if (n === 0) return
  const cx = VB_W / 2
  if (n === 1) {
    nodes[0].x = cx
    nodes[0].y = CH_BAND_Y + CH_BAND_H / 2
    return
  }

  // Drawable clusters = logical/virtual (filled hulls). Physical/outline clusters
  // span everything, so they don't drive grouping.
  const ids = new Set(nodes.map((nd) => nd.id))
  const logical = clusters
    .filter((c) => !c.outline)
    .filter((c) => Object.keys(c.members).some((id) => ids.has(id)))

  if (logical.length === 0) {
    layoutArc(nodes, cx)
    return
  }

  // Centroid slot per logical cluster, evenly spread along the band.
  const slotY = CH_BAND_Y + CH_BAND_H / 2
  const usable = VB_W - 2 * CH_MARGIN
  const centroid = new Map<string, { x: number; y: number }>()
  logical.forEach((c, i) => {
    const t = logical.length === 1 ? 0.5 : i / (logical.length - 1)
    centroid.set(c.id, { x: CH_MARGIN + t * usable, y: slotY })
  })

  // Membership of each node among logical clusters (deterministic order).
  const memberClusters = (id: string) =>
    logical.filter((c) => c.members[id]).map((c) => c.id)

  // Group nodes by membership signature; place the whole group near the average
  // of its clusters' centroids (boundary for shared nodes), then fan out.
  const groups = new Map<string, ChNode[]>()
  for (const nd of nodes) {
    const mc = memberClusters(nd.id)
    const sig = mc.length ? mc.join('|') : '__none__'
    if (!groups.has(sig)) groups.set(sig, [])
    groups.get(sig)!.push(nd)
  }

  // Stable group order: by signature string.
  const sigOrder = [...groups.keys()].sort()
  for (const sig of sigOrder) {
    const members = groups.get(sig)!
    const mc = sig === '__none__' ? [] : sig.split('|')
    let gx = cx
    let gy = slotY
    if (mc.length > 0) {
      gx = mc.reduce((s, id) => s + (centroid.get(id)?.x ?? cx), 0) / mc.length
      gy =
        mc.reduce((s, id) => s + (centroid.get(id)?.y ?? slotY), 0) / mc.length
      // Shared nodes (≥2 clusters) sit slightly higher so the lens reads cleanly.
      if (mc.length >= 2) gy -= 30
    }
    fanOut(members, gx, gy)
  }

  clampToBand(nodes)
}

/** Spread `members` on a compact centered grid around (gx, gy). Deterministic.
 * Row/col steps shrink for large groups so the grid stays inside the band. */
function fanOut(members: ChNode[], gx: number, gy: number) {
  const k = members.length
  if (k === 1) {
    members[0].x = gx
    members[0].y = gy
    return
  }
  // Prefer a WIDE grid (more columns, fewer rows) — the canvas has width to
  // spare and tall stacks overlap. Small groups stay on a single row; even a
  // capped 24-node cluster needs only ~3 rows.
  const cols =
    k <= 5
      ? k
      : Math.min(k, Math.max(Math.ceil(Math.sqrt(k)), Math.ceil(k / 3)))
  const rows = Math.ceil(k / cols)
  const stepY = Math.min(132, rows > 1 ? CH_BAND_H / (rows - 1) : 132)
  const stepX = Math.min(160, Math.max(108, stepY))
  // Zigzag: alternate columns sit half a stagger above/below the row line so
  // adjacent nodes are never on the same horizontal line — their labels can't
  // collide even when the group is squeezed near a margin.
  const STAGGER = 46
  members.forEach((nd, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    const rowCount = Math.min(cols, k - row * cols)
    const rowOffset = ((rowCount - 1) * stepX) / 2
    const zig = cols > 1 ? (col % 2 === 0 ? -STAGGER / 2 : STAGGER / 2) : 0
    nd.x = gx - rowOffset + col * stepX
    nd.y = gy + row * stepY - ((rows - 1) * stepY) / 2 + zig
  })
}

/** Simple centered arc / multi-row grid (no logical clusters). Rows are packed
 * into the readable band so even a capped-large N stays inside the viewBox. */
function layoutArc(nodes: ChNode[], cx: number) {
  const n = nodes.length
  const usable = VB_W - 2 * CH_MARGIN
  const perRow = Math.min(n, Math.max(1, Math.floor(usable / 150) + 1))
  const rows = Math.ceil(n / perRow)
  if (rows <= 1) {
    const baseY = CH_BAND_Y + CH_BAND_H / 2
    const step = n > 1 ? Math.min(220, usable / (n - 1)) : 0
    const total = (n - 1) * step
    nodes.forEach((node, i) => {
      node.x = cx - total / 2 + i * step
      const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0
      node.y = baseY + Math.round((1 - t * t) * 34)
    })
    return
  }
  const rowStep = Math.min(120, CH_BAND_H / Math.max(1, rows - 1))
  const top = CH_BAND_Y
  nodes.forEach((node, i) => {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const inRow = Math.min(perRow, n - row * perRow)
    const step = inRow > 1 ? Math.min(160, usable / (inRow - 1)) : 0
    const total = (inRow - 1) * step
    node.x = cx - total / 2 + col * step
    node.y = top + row * rowStep
  })
}

/** Keep nodes inside the readable band + horizontal margins. */
function clampToBand(nodes: ChNode[]) {
  for (const nd of nodes) {
    nd.x = Math.max(CH_MARGIN, Math.min(VB_W - CH_MARGIN, nd.x))
    nd.y = Math.max(CH_BAND_Y - 10, Math.min(CH_BAND_Y + CH_BAND_H, nd.y))
  }
}

/**
 * Translate the whole composition (keepers + CH nodes) so the bounding box of
 * its CONTENT envelopes is centered in the draw area. Keeps relative positions
 * intact; offset is clamped so content never leaves the viewBox when it fits.
 * This is the "auto layout" — sparse graphs (no keeper, one node) sit centered
 * instead of stuck in a fixed band.
 */
function centerContent(keepers: KeeperNode[], chNodes: ChNode[]) {
  if (keepers.length === 0 && chNodes.length === 0) return
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const k of keepers) {
    minX = Math.min(minX, k.x - keeperHalfExtent())
    maxX = Math.max(maxX, k.x + keeperHalfExtent())
    minY = Math.min(minY, k.y - keeperUpExtent(k))
    maxY = Math.max(maxY, k.y + keeperDownExtent())
  }
  for (const c of chNodes) {
    minX = Math.min(minX, c.x - chHalfExtent())
    maxX = Math.max(maxX, c.x + chHalfExtent())
    minY = Math.min(minY, c.y - chUpExtent())
    maxY = Math.max(maxY, c.y + chDownExtent(c))
  }
  let dx = (VB_W - minX - maxX) / 2
  let dy = (VB_H - minY - maxY) / 2
  // When content fits, keep it fully inside; otherwise anchor the top edge.
  if (minY + dy < 0 || maxY + dy > VB_H) dy = Math.max(-minY, dy)
  if (minX + dx < 0 || maxX + dx > VB_W) dx = Math.max(-minX, dx)
  for (const k of keepers) {
    k.x += dx
    k.y += dy
  }
  for (const c of chNodes) {
    c.x += dx
    c.y += dy
  }
}

/**
 * Push apart any nodes closer than `minDist` from each other.
 * Iterative repulsion — converges in a few passes for typical cluster sizes.
 */
function enforceMinDistance(
  nodes: { x: number; y: number }[],
  minDist: number
) {
  for (let iter = 0; iter < 12; iter++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minDist) {
          const push = (minDist - dist) / 2 + 1
          if (dist > 1e-9) {
            const nx = dx / dist
            const ny = dy / dist
            nodes[i].x -= nx * push
            nodes[i].y -= ny * push
            nodes[j].x += nx * push
            nodes[j].y += ny * push
          } else {
            // Coincident — push apart at a spread angle.
            const angle = (Math.PI * 2 * (i + 1)) / nodes.length
            nodes[i].x -= Math.cos(angle) * (minDist / 2)
            nodes[i].y -= Math.sin(angle) * (minDist / 2)
            nodes[j].x += Math.cos(angle) * (minDist / 2)
            nodes[j].y += Math.sin(angle) * (minDist / 2)
          }
          moved = true
        }
      }
    }
    if (!moved) break
  }
}

// Corner radius for the cluster territory rectangles — round enough that a
// single-node cluster reads as a soft squircle, capped so it never over-rounds.
const CLUSTER_RECT_RADIUS = 54

/** Stable string hash → non-negative int. Deterministic (layout is tested). */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Keeper quorum region: a rounded rect whose envelope encloses every voting
 * keeper glyph + its star/label. Asymmetric (small top, room for the label). */
function buildKeeperRect(voters: KeeperNode[]): string {
  const minX = Math.min(...voters.map((k) => k.x - keeperHalfExtent()))
  const maxX = Math.max(...voters.map((k) => k.x + keeperHalfExtent()))
  const minY = Math.min(...voters.map((k) => k.y - keeperUpExtent(k)))
  const maxY = Math.max(...voters.map((k) => k.y + keeperDownExtent()))
  const m = ENVELOPE_MARGIN
  return roundedRectPath(
    minX - m,
    minY - m,
    maxX - minX + 2 * m,
    maxY - minY + 2 * m,
    CLUSTER_RECT_RADIUS
  )
}

/**
 * Build the cluster overlay paths from rendered member positions. Pure: depends
 * only on structure + layout, not live metrics. Each territory is a rounded
 * bounding RECTANGLE around its members' CONTENT envelope (glyph + labels) so
 * every node and its text sit INSIDE the boundary. A small expand-only jitter
 * offsets overlapping rects so two clusters read as distinct territories (no
 * collinear edges). Sorted by area DESC so the canvas draws the largest first.
 */
function buildClusterHulls(
  clusters: ClusterInfo[],
  nodeById: Record<string, KeeperNode | ChNode>,
  renderedIds: Set<string>
): ClusterHull[] {
  const hulls: ClusterHull[] = []
  for (const cl of clusters) {
    const centers = Object.keys(cl.members)
      .filter((id) => renderedIds.has(id))
      .map((id) => nodeById[id])
      .filter(Boolean)
    if (centers.length === 0) continue
    // Content bounding box: each member's glyph + labels, so nothing spills out.
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const c of centers) {
      const down = isKeeperNode(c)
        ? keeperDownExtent()
        : chDownExtent(c as ChNode)
      minX = Math.min(minX, c.x - chHalfExtent())
      maxX = Math.max(maxX, c.x + chHalfExtent())
      minY = Math.min(minY, c.y - chUpExtent())
      maxY = Math.max(maxY, c.y + down)
    }
    // Expand-only jitter (content always stays inside): offsets the edges of
    // overlapping rects so they don't fall on the same line.
    const m = ENVELOPE_MARGIN
    minX -= m + (hashStr(cl.id) % 4) * 7
    maxX += m + (hashStr(`${cl.id}~r`) % 4) * 7
    minY -= m + (hashStr(`${cl.id}~t`) % 4) * 7
    maxY += m + (hashStr(`${cl.id}~b`) % 4) * 7
    const w = maxX - minX
    const h = maxY - minY
    const d = roundedRectPath(minX, minY, w, h, CLUSTER_RECT_RADIUS)
    if (!d) continue
    hulls.push({
      id: cl.id,
      name: cl.name,
      color: cl.color,
      outline: cl.outline,
      d,
      area: w * h,
      labelX: (minX + maxX) / 2,
      labelY: minY,
    })
  }
  // Largest first (drawn behind). Tie-break by id for determinism.
  hulls.sort((a, b) => b.area - a.area || a.id.localeCompare(b.id))
  nudgeLabels(hulls)
  return hulls
}

/** Push overlapping cluster labels apart so they stay readable. Deterministic. */
function nudgeLabels(hulls: ClusterHull[]) {
  const sorted = [...hulls].sort(
    (a, b) => a.labelX - b.labelX || a.id.localeCompare(b.id)
  )
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (
      Math.abs(cur.labelX - prev.labelX) < 70 &&
      Math.abs(cur.labelY - prev.labelY) < 16
    ) {
      cur.labelY = prev.labelY - 16
    }
  }
}
