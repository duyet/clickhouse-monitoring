'use client'

import type { ChNode, KeeperNode, TopologyModel } from './model'

import { hullPath } from './geometry'
import { STATUS_COLOR, VB_H, VB_W } from './model'
import { useMemo } from 'react'

const CH_R = 33
const KP_R = 27

interface LiveMetrics {
  cpuPct: number | null
  memPct: number | null
}

interface TopoCanvasProps {
  model: TopologyModel
  /** Live metrics for the connected (is_local) node, keyed by node id. */
  liveById: Record<string, LiveMetrics>
  selected: string | null
  activeCluster: string | null
  onSelect: (id: string) => void
  onClearSelect: () => void
}

function clampPct(v: number): number {
  return Math.max(0.02, Math.min(1, v || 0))
}

const DbMark = ({ r }: { r: number }) => (
  <g
    transform={`translate(0 ${-r * 0.42})`}
    stroke="hsl(var(--muted-foreground))"
    strokeWidth="1.4"
    fill="none"
    opacity="0.55"
  >
    <ellipse cx="0" cy="0" rx="7" ry="2.6" />
    <path d="M -7 0 v 5 c 0 1.4 3.1 2.6 7 2.6 s 7 -1.2 7 -2.6 v -5" />
  </g>
)

const KeeperMark = ({ r, isLeader }: { r: number; isLeader: boolean }) => (
  <g
    transform={`translate(0 ${-r * 0.42})`}
    stroke={isLeader ? '#f59e0b' : 'hsl(var(--muted-foreground))'}
    strokeWidth="1.5"
    fill="none"
    opacity="0.7"
  >
    <path d="M 0 -6 L 6 -3 v 4.5 c 0 4 -3 6.5 -6 7.5 c -3 -1 -6 -3.5 -6 -7.5 V -3 Z" />
  </g>
)

function ChGlyph({
  node,
  live,
  selected,
  dimmed,
  onSelect,
}: {
  node: ChNode
  live: LiveMetrics | undefined
  selected: boolean
  dimmed: boolean
  onSelect: (id: string) => void
}) {
  const r = CH_R
  const statusCol = STATUS_COLOR[node.status]
  const cpu = live?.cpuPct ?? null
  // Ring: live CPU when available (local node), else a thin structural arc.
  const ringPct = cpu !== null ? clampPct(cpu / 100) : 0.04
  const ringCol =
    cpu !== null
      ? ringPct > 0.85
        ? '#f43f5e'
        : ringPct > 0.6
          ? '#f59e0b'
          : '#3b82f6'
      : 'hsl(var(--muted-foreground))'
  const circ = 2 * Math.PI * r
  const sub1 =
    cpu !== null
      ? `cpu ${Math.round(cpu)}%${live?.memPct !== null && live?.memPct !== undefined ? ` · mem ${Math.round(live.memPct)}%` : ''}`
      : node.errors > 0
        ? `${node.errors} errors`
        : node.isLocal
          ? 'local node'
          : 'remote node'

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.28 : 1,
        transition: 'opacity .25s',
      }}
    >
      {selected && (
        <circle
          r={r + 9}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          opacity="0.9"
          style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary)/0.5))' }}
        />
      )}
      <circle
        r={r}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="1.5"
      />
      <circle r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
      <circle
        r={r}
        fill="none"
        stroke={ringCol}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${(circ * ringPct).toFixed(1)} ${circ.toFixed(1)}`}
        transform="rotate(-90)"
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
      <DbMark r={r} />
      <text
        textAnchor="middle"
        y={7}
        fontSize="12.5"
        fontWeight="700"
        fill="hsl(var(--foreground))"
        className="font-mono"
      >
        {node.id}
      </text>
      <circle
        cx={r * 0.72}
        cy={-r * 0.72}
        r="5.5"
        fill={statusCol}
        stroke="hsl(var(--card))"
        strokeWidth="2"
      />
      <text
        textAnchor="middle"
        y={r + 16}
        fontSize="11.5"
        fontWeight="600"
        fill="hsl(var(--foreground))"
        className="font-mono"
      >
        {node.host}
      </text>
      <text
        textAnchor="middle"
        y={r + 31}
        fontSize="10.5"
        fill="hsl(var(--muted-foreground))"
        className="font-mono"
      >
        {sub1}
      </text>
      {node.isLocal && (
        <g transform={`translate(0 ${r + 40})`}>
          <rect
            x="-22"
            y="0"
            width="44"
            height="15"
            rx="7.5"
            fill="hsl(var(--primary)/0.12)"
            stroke="hsl(var(--primary)/0.4)"
            strokeWidth="1"
          />
          <text
            textAnchor="middle"
            y="10.5"
            fontSize="8.5"
            fontWeight="700"
            fill="hsl(var(--primary))"
            style={{ letterSpacing: '0.06em' }}
          >
            LOCAL
          </text>
        </g>
      )}
    </g>
  )
}

function KeeperGlyph({
  node,
  selected,
  dimmed,
  onSelect,
}: {
  node: KeeperNode
  selected: boolean
  dimmed: boolean
  onSelect: (id: string) => void
}) {
  const r = KP_R
  const isLeader = node.isLeader
  const statusCol = node.isConnected ? STATUS_COLOR.healthy : STATUS_COLOR.down
  // Ring reflects connection + latency lightly; full arc when connected.
  const ringPct = node.isConnected ? 1 : 0.04
  const ringCol = isLeader ? '#f59e0b' : '#10b981'
  const circ = 2 * Math.PI * r
  const sub1 = `${node.role} · ${node.avgLatency ? `${node.avgLatency.toFixed(1)}ms` : '—'}`

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.28 : 1,
        transition: 'opacity .25s',
      }}
    >
      {selected && (
        <circle
          r={r + 9}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          opacity="0.9"
          style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary)/0.5))' }}
        />
      )}
      <circle
        r={r}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth="1.5"
      />
      <circle r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
      <circle
        r={r}
        fill="none"
        stroke={ringCol}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${(circ * ringPct).toFixed(1)} ${circ.toFixed(1)}`}
        transform="rotate(-90)"
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
      <KeeperMark r={r} isLeader={isLeader} />
      <text
        textAnchor="middle"
        y={5}
        fontSize="12.5"
        fontWeight="700"
        fill="hsl(var(--foreground))"
        className="font-mono"
      >
        {node.id}
      </text>
      <circle
        cx={r * 0.72}
        cy={-r * 0.72}
        r="5.5"
        fill={statusCol}
        stroke="hsl(var(--card))"
        strokeWidth="2"
      />
      {isLeader && (
        <text textAnchor="middle" y={-r - 6} fontSize="15" fill="#f59e0b">
          ★
        </text>
      )}
      <text
        textAnchor="middle"
        y={r + 16}
        fontSize="11.5"
        fontWeight="600"
        fill="hsl(var(--foreground))"
        className="font-mono"
      >
        {node.host}
      </text>
      <text
        textAnchor="middle"
        y={r + 31}
        fontSize="10.5"
        fill="hsl(var(--muted-foreground))"
        className="font-mono"
      >
        {sub1}
      </text>
    </g>
  )
}

export function TopoCanvas({
  model,
  liveById,
  selected,
  activeCluster,
  onSelect,
  onClearSelect,
}: TopoCanvasProps) {
  const {
    keepers,
    chNodes,
    clusters,
    nodeById,
    clusterById,
    raftEdges,
    replEdges,
    coordEdges,
    keeperHull,
  } = model

  // Hull paths are pure geometry over structural positions → memoize once.
  const logicalHulls = useMemo(
    () =>
      clusters.map((cl) => {
        const centers = Object.keys(cl.members)
          .map((id) => nodeById[id])
          .filter(Boolean)
        const minY = centers.length ? Math.min(...centers.map((c) => c.y)) : 0
        const cx = centers.length
          ? centers.reduce((s, c) => s + c.x, 0) / centers.length
          : 0
        const pad = 50
        return {
          cl,
          d: hullPath(centers, pad),
          tagX: cx,
          tagY: minY - pad - 6,
        }
      }),
    [clusters, nodeById]
  )

  const edge = (a: string, b: string) => {
    const na = nodeById[a]
    const nb = nodeById[b]
    if (!na || !nb) return null
    return { x1: na.x, y1: na.y, x2: nb.x, y2: nb.y }
  }
  const memberOf = (id: string) =>
    activeCluster ? !!clusterById[activeCluster]?.members[id] : true

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full select-none"
      onClick={onClearSelect}
      role="img"
      aria-label="Cluster topology graph"
    >
      <defs>
        <pattern
          id="topo-dots"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="1.2"
            cy="1.2"
            r="1.2"
            fill="hsl(var(--muted-foreground))"
            opacity="0.1"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#topo-dots)" />

      {/* keeper quorum hull */}
      {keeperHull && (
        <g
          opacity={activeCluster ? 0.4 : 1}
          style={{ transition: 'opacity .25s' }}
        >
          <path
            d={keeperHull}
            fill="#10b981"
            fillOpacity="0.06"
            stroke="#10b981"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          {keepers[0] && (
            <text
              x={VB_W / 2}
              y={42}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#10b981"
              style={{ letterSpacing: '0.04em' }}
            >
              Keeper quorum · Raft
            </text>
          )}
        </g>
      )}

      {/* logical / physical cluster hulls */}
      {logicalHulls.map(({ cl, d, tagX, tagY }) => {
        const active = activeCluster === cl.id
        const faded = activeCluster && !active
        if (!d) return null
        if (cl.outline) {
          return (
            <g
              key={cl.id}
              opacity={faded ? 0.25 : 1}
              style={{ transition: 'opacity .25s' }}
            >
              <path
                d={d}
                fill="none"
                stroke={cl.color}
                strokeOpacity={active ? 0.9 : 0.5}
                strokeWidth={active ? 2 : 1.4}
                strokeDasharray="2 5"
                strokeLinecap="round"
              />
            </g>
          )
        }
        return (
          <g
            key={cl.id}
            opacity={faded ? 0.22 : 1}
            style={{ transition: 'opacity .25s' }}
          >
            <path
              d={d}
              fill={cl.color}
              fillOpacity={active ? 0.2 : 0.12}
              stroke={cl.color}
              strokeOpacity={active ? 0.9 : 0.45}
              strokeWidth={active ? 2 : 1.3}
            />
            <text
              x={tagX}
              y={tagY}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="700"
              fill={cl.color}
              opacity={active ? 1 : 0.85}
              className="font-mono"
              style={{ letterSpacing: '0.02em' }}
            >
              {cl.name}
            </text>
          </g>
        )
      })}

      {/* edges */}
      <g
        opacity={activeCluster ? 0.35 : 1}
        style={{ transition: 'opacity .25s' }}
      >
        {coordEdges.map(([a, b], i) => {
          const e = edge(a, b)
          if (!e) return null
          return (
            <line
              key={`c${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity="0.3"
              strokeWidth="1.2"
              strokeDasharray="4 5"
            />
          )
        })}
        {raftEdges.map(([a, b], i) => {
          const e = edge(a, b)
          if (!e) return null
          return (
            <line
              key={`r${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="#10b981"
              strokeOpacity="0.45"
              strokeWidth="1.8"
            />
          )
        })}
      </g>
      {replEdges.map(([a, b], i) => {
        const e = edge(a, b)
        if (!e) return null
        const lit = !activeCluster || (memberOf(a) && memberOf(b))
        return (
          <line
            key={`p${i}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="#3b82f6"
            strokeOpacity={lit ? 0.55 : 0.12}
            strokeWidth="2"
            style={{ transition: 'stroke-opacity .25s' }}
          />
        )
      })}

      {/* nodes */}
      {keepers.map((n) => (
        <KeeperGlyph
          key={n.id}
          node={n}
          selected={selected === n.id}
          dimmed={false}
          onSelect={onSelect}
        />
      ))}
      {chNodes.map((n) => (
        <ChGlyph
          key={n.id}
          node={n}
          live={liveById[n.id]}
          selected={selected === n.id}
          dimmed={activeCluster ? !memberOf(n.id) : false}
          onSelect={onSelect}
        />
      ))}
    </svg>
  )
}
