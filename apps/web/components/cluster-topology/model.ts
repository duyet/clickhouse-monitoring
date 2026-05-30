/**
 * Build the topology model from REAL ClickHouse data.
 *
 * Inputs:
 *  - rows from `clusters-topology` (system.clusters, one row per cluster/shard/replica)
 *  - rows from `keeper-info` (system.zookeeper_info, one row per Keeper node) — optional
 *
 * Output: a deterministic, laid-out model the canvas + inspector render. Layout is a
 * pure function of the structural data, so it is computed once in useMemo and is stable
 * across live-metric ticks.
 */

import type { ClusterTopologyRow } from '@/lib/query-config/system/clusters-topology'

import { hullPath } from './geometry'

export interface KeeperNode {
  id: string
  host: string
  port: number
  role: 'leader' | 'follower' | 'standalone' | 'unknown'
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

export interface ChNode {
  id: string
  host: string
  address: string
  port: number
  isLocal: boolean
  /** healthy | warn | down — derived from errors/active, never random */
  status: 'healthy' | 'warn' | 'down'
  errors: number
  slowdowns: number
  recoveryTime: number
  isActive: number | null
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

export interface TopologyModel {
  keepers: KeeperNode[]
  chNodes: ChNode[]
  clusters: ClusterInfo[]
  nodeById: Record<string, KeeperNode | ChNode>
  clusterById: Record<string, ClusterInfo>
  raftEdges: [string, string][]
  replEdges: [string, string][]
  coordEdges: [string, string][]
  keeperHull: string
  leaderId: string | null
  quorumHealthy: boolean
  counts: {
    nodes: number
    keepers: number
    chNodes: number
    clusters: number
    physical: number
    logical: number
  }
}

/** Type guard: is this node a Keeper (vs a ClickHouse node)? */
export function isKeeperNode(n: KeeperNode | ChNode): n is KeeperNode {
  return 'role' in n
}

// Canvas viewBox. Keep in sync with TopoCanvas VB_W/VB_H.
export const VB_W = 770
export const VB_H = 560
const CH_R = 33

export const STATUS_COLOR: Record<string, string> = {
  healthy: '#10b981',
  warn: '#f59e0b',
  down: '#f43f5e',
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

/** Keeper-row Keeper raw row shape (subset of keeper-info columns we use). */
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

const num = (v: unknown, d = 0): number => {
  const n = typeof v === 'string' ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : d
}
const truthy = (v: unknown): boolean => v === 1 || v === true || v === '1'

function deriveKeeperRole(
  isLeader: boolean,
  serverState: string | undefined,
  count: number
): KeeperNode['role'] {
  if (isLeader) return 'leader'
  const s = serverState?.toLowerCase()
  if (s === 'follower' || s === 'standalone') return s
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

export function buildTopologyModel(
  clusterRows: ClusterTopologyRow[],
  keeperRows: KeeperInfoRow[]
): TopologyModel {
  // ── 1. collect unique CH hosts across all clusters ──
  // A host key combines name+port so the same machine in multiple clusters maps
  // to ONE node (the overlapping-hull story).
  const hostKey = (r: { host_name: string; port: number }) =>
    `${r.host_name}:${r.port}`

  const hostOrder: string[] = []
  const hostMeta = new Map<
    string,
    { row: ClusterTopologyRow; errors: number; slowdowns: number }
  >()

  for (const r of clusterRows) {
    const k = hostKey(r)
    if (!hostMeta.has(k)) {
      hostOrder.push(k)
      hostMeta.set(k, {
        row: r,
        errors: num(r.errors_count),
        slowdowns: num(r.slowdowns_count),
      })
    } else {
      const m = hostMeta.get(k)!
      m.errors += num(r.errors_count)
      m.slowdowns += num(r.slowdowns_count)
      if (truthy(r.is_local)) m.row = r
    }
  }

  const idByHostKey = new Map<string, string>()
  const chNodes: ChNode[] = hostOrder.map((k, i) => {
    const { row, errors, slowdowns } = hostMeta.get(k)!
    const id = shortId(row.host_name, i)
    idByHostKey.set(k, id)
    const isActive = row.is_active
    const inactive =
      isActive !== null && isActive !== undefined && !truthy(isActive)
    const status: ChNode['status'] = inactive
      ? 'down'
      : errors > 0
        ? 'warn'
        : 'healthy'
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

  for (const r of clusterRows) {
    const id = idByHostKey.get(hostKey(r))
    if (!id) continue
    if (!clusterMembers.has(r.cluster)) {
      clusterNames.push(r.cluster)
      clusterMembers.set(r.cluster, {})
      clusterShards.set(r.cluster, new Set())
      clusterReplicas.set(r.cluster, new Set())
    }
    clusterMembers.get(r.cluster)![id] = {
      s: num(r.shard_num),
      r: num(r.replica_num),
    }
    clusterShards.get(r.cluster)!.add(num(r.shard_num))
    clusterReplicas.get(r.cluster)!.add(num(r.replica_num))
  }

  let paletteIdx = 0
  const clusters: ClusterInfo[] = clusterNames.map((name) => {
    const members = clusterMembers.get(name)!
    const shards = clusterShards.get(name)!.size
    const physical = isPhysicalName(name)
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
  const keeperRowsClean = keeperRows.filter((r) => r && r.host)
  const hasExplicitLeader = keeperRowsClean.some((r) => truthy(r.is_leader))
  const keepers: KeeperNode[] = keeperRowsClean.map((r, i) => {
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

  // Prefer the explicit leader; if none is reported (e.g. standalone Keeper),
  // fall back to the first node so coordination links still anchor somewhere.
  const leaderId =
    keepers.find((k) => k.isLeader)?.id ??
    (hasExplicitLeader ? null : (keepers[0]?.id ?? null))
  const quorumHealthy =
    keepers.length > 0 &&
    keepers.every((k) => k.isConnected) &&
    keepers.some((k) => k.isLeader || k.role === 'standalone')

  // ── 4. layout (deterministic) ──
  layoutKeepers(keepers)
  layoutChNodes(chNodes)

  // ── 5. edges ──
  // Raft: full mesh among keepers (small N).
  const raftEdges: [string, string][] = []
  for (let i = 0; i < keepers.length; i++) {
    for (let j = i + 1; j < keepers.length; j++) {
      raftEdges.push([keepers[i].id, keepers[j].id])
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

  const nodeById: Record<string, KeeperNode | ChNode> = {}
  keepers.forEach((k) => {
    nodeById[k.id] = k
  })
  chNodes.forEach((n) => {
    nodeById[n.id] = n
  })
  const clusterById: Record<string, ClusterInfo> = {}
  clusters.forEach((c) => {
    clusterById[c.id] = c
  })

  const keeperHull = keepers.length >= 2 ? hullPath(keepers, 46) : ''

  return {
    keepers,
    chNodes,
    clusters,
    nodeById,
    clusterById,
    raftEdges,
    replEdges,
    coordEdges,
    keeperHull,
    leaderId,
    quorumHealthy,
    counts: {
      nodes: keepers.length + chNodes.length,
      keepers: keepers.length,
      chNodes: chNodes.length,
      clusters: clusters.length,
      physical: clusters.filter((c) => c.kind === 'physical').length,
      logical: clusters.filter((c) => c.kind === 'logical').length,
    },
  }
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

/** ClickHouse nodes: an arc/row below the keepers, centered. */
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
  const step = Math.min(170, usable / (n - 1))
  const total = (n - 1) * step
  nodes.forEach((node, i) => {
    node.x = cx - total / 2 + i * step
    // Gentle arc: -1 at the left edge, 0 in the middle, +1 at the right edge.
    // `1 - t²` peaks at the middle, so middle nodes dip ~24px lower than the
    // outer ones — a shallow smile that keeps replication links readable.
    const t = (i / (n - 1)) * 2 - 1
    node.y = baseY + Math.round((1 - t * t) * 24)
  })
}
