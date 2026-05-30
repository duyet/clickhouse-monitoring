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

import { hullPath } from './geometry'

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

// Canvas viewBox. Keep in sync with TopoCanvas VB_W/VB_H.
export const VB_W = 770
export const VB_H = 560
const CH_R = 33

// Cap CH nodes drawn on the canvas so large clusters stay readable. The full
// structural truth is preserved in meta.counts / meta.hiddenChNodes.
export const CH_RENDER_CAP = 24

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
  const hasInfo = keeperRows.some((r) => r && r.host)
  const hasPresence = presenceRows.some((r) => r && r.host)
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
  const presenceClean = presenceRows.filter((r) => r && r.host)
  const keeperRowsClean = keeperRows.filter((r) => r && r.host)
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
  // Replication: within each shard of each cluster, link consecutive replicas.
  const replSet = new Set<string>()
  const replEdges: [string, string][] = []
  for (const c of clusters) {
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
  layoutChNodes(renderCh)

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

  const keeperHull = keepers.length >= 2 ? hullPath(keepers, 46) : ''

  return {
    ...data,
    keepers,
    chNodes: renderCh,
    nodeById,
    clusterById,
    raftEdges: data.raftEdges,
    replEdges: data.replEdges,
    coordEdges: data.coordEdges,
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
    keepers[0].y = 110
    return
  }
  // leader on top apex, followers spread on a lower row
  const leaderIdx = Math.max(
    0,
    keepers.findIndex((k) => k.isLeader)
  )
  const followers = keepers.filter((_, i) => i !== leaderIdx)
  keepers[leaderIdx].x = cx
  keepers[leaderIdx].y = 92
  const spread = Math.min(110, 70 + followers.length * 10)
  const total = (followers.length - 1) * spread
  followers.forEach((f, i) => {
    f.x = cx - total / 2 + i * spread
    f.y = 176
  })
}

/**
 * ClickHouse nodes: a centered grid below the keepers. A single row reads best
 * for small N; for larger N we wrap into rows so a wide cluster does not collide
 * within the fixed viewBox.
 */
function layoutChNodes(nodes: ChNode[]) {
  const n = nodes.length
  if (n === 0) return
  const cx = VB_W / 2
  const baseY = 400
  if (n === 1) {
    nodes[0].x = cx
    nodes[0].y = baseY
    return
  }
  const usable = VB_W - 2 * (CH_R + 60)
  // How many fit on a row before they crowd (min ~120px center spacing).
  const perRow = Math.max(2, Math.min(n, Math.floor(usable / 120) + 1))
  if (n <= perRow) {
    const step = Math.min(170, usable / (n - 1))
    const total = (n - 1) * step
    nodes.forEach((node, i) => {
      node.x = cx - total / 2 + i * step
      // Gentle arc: middle nodes dip slightly so replication links stay readable.
      const t = (i / (n - 1)) * 2 - 1
      node.y = baseY + Math.round((1 - t * t) * 24)
    })
    return
  }
  // Multi-row grid.
  const rows = Math.ceil(n / perRow)
  const rowGap = 96
  const startY = baseY - ((rows - 1) * rowGap) / 2
  nodes.forEach((node, i) => {
    const row = Math.floor(i / perRow)
    const inRow = Math.min(perRow, n - row * perRow)
    const col = i % perRow
    const step = inRow > 1 ? Math.min(150, usable / (inRow - 1)) : 0
    const total = (inRow - 1) * step
    node.x = cx - total / 2 + col * step
    node.y = startY + row * rowGap
  })
}
