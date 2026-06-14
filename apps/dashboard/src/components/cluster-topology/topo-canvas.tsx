import type { TopologyModel } from './model'
import type { LiveMetrics } from './topo-glyphs'

import { KP_R, STATUS_COLOR, VB_W } from './model'
import { ChGlyph, curvePath, HullLabel, KeeperGlyph } from './topo-glyphs'

interface TopoCanvasProps {
  model: TopologyModel
  /** Live metrics for the connected (is_local) node, keyed by node id. */
  liveById: Record<string, LiveMetrics>
  selected: string | null
  activeCluster: string | null
  onSelect: (id: string) => void
  onClearSelect: () => void
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
    nodeById,
    clusterById,
    raftEdges,
    replEdges,
    coordEdges,
    clusterHulls,
    keeperHull,
    vbHeight,
  } = model

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
      viewBox={`0 0 ${VB_W} ${vbHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full select-none"
      onClick={onClearSelect}
      role="img"
      aria-label="Cluster topology graph"
    >
      <defs>
        <pattern
          id="topo-dots"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="1.2"
            cy="1.2"
            r="1.2"
            fill="var(--muted-foreground)"
            opacity="0.09"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width={VB_W} height={vbHeight} fill="url(#topo-dots)" />

      {/* keeper quorum region — soft container + a clear label chip */}
      {keeperHull && (
        <g
          opacity={activeCluster ? 0.4 : 1}
          style={{ transition: 'opacity .25s' }}
        >
          <path
            d={keeperHull}
            fill={STATUS_COLOR.healthy}
            fillOpacity="0.05"
            stroke={STATUS_COLOR.healthy}
            strokeOpacity="0.4"
            strokeWidth="1.4"
            strokeDasharray="6 5"
          />
          {keepers[0] && (
            <HullLabel
              x={VB_W / 2}
              y={Math.max(13, Math.min(...keepers.map((k) => k.y)) - KP_R - 32)}
              text="Keeper quorum · Raft"
              color={STATUS_COLOR.healthy}
            />
          )}
        </g>
      )}

      {/* cluster overlays — offset rounded rects, z-ordered area DESC (largest
          behind). A background-colored CASING under each colored boundary lets
          crossing / nested boundaries read cleanly instead of tangling at their
          intersections. EVERY cluster gets its own palette color + a solid label
          pill; physical/implicit clusters just read softer (lower fill/stroke
          opacity) and are present only when toggled on upstream. */}
      {clusterHulls.map((h) => {
        const active = activeCluster === h.id
        const faded = activeCluster && !active
        // Physical/implicit clusters read softer than logical ones so the eye
        // still separates "implicit scaffolding" from configured territories.
        const fillOp = h.outline ? (active ? 0.07 : 0.04) : active ? 0.14 : 0.08
        const strokeOp = h.outline
          ? active
            ? 0.85
            : 0.5
          : active
            ? 0.95
            : 0.65
        const strokeW = h.outline ? (active ? 2 : 1.5) : active ? 2.4 : 1.7
        return (
          <g
            key={h.id}
            opacity={faded ? (h.outline ? 0.22 : 0.2) : 1}
            style={{ transition: 'opacity .25s' }}
          >
            <path d={h.d} fill={h.color} fillOpacity={fillOp} />
            {/* casing: a wider card-colored stroke beneath the colored one so two
                overlapping/nested boundaries don't visually collide where they
                cross — the topmost boundary reads as cutting cleanly through. */}
            <path
              d={h.d}
              fill="none"
              stroke="var(--card)"
              strokeOpacity={0.95}
              strokeWidth={strokeW + 2.2}
              strokeLinejoin="round"
            />
            <path
              d={h.d}
              fill="none"
              stroke={h.color}
              strokeOpacity={strokeOp}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* leader line: when the pill was dropped below the rect to stay
                readable, connect it back up so the name stays attributed. */}
            {h.leader && (
              <line
                x1={h.labelX}
                y1={h.labelY - 9}
                x2={h.anchorX}
                y2={h.anchorY}
                stroke={h.color}
                strokeOpacity={active ? 0.7 : 0.4}
                strokeWidth="1"
                strokeDasharray="2 3"
                style={{ pointerEvents: 'none' }}
              />
            )}
            <HullLabel
              x={h.labelX}
              y={h.labelY}
              text={h.name}
              color={h.color}
            />
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
            <path
              key={`c${i}`}
              d={curvePath(e.x1, e.y1, e.x2, e.y2)}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          )
        })}
        {raftEdges.map(([a, b], i) => {
          const e = edge(a, b)
          if (!e) return null
          return (
            <path
              key={`r${i}`}
              d={curvePath(e.x1, e.y1, e.x2, e.y2)}
              fill="none"
              stroke={STATUS_COLOR.healthy}
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
          <path
            key={`p${i}`}
            d={curvePath(e.x1, e.y1, e.x2, e.y2)}
            fill="none"
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
