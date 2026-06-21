import type { TopologyModel } from './model'
import type { LiveMetrics } from './topo-glyphs'

import { CH_R, KP_R, STATUS_COLOR, VB_W } from './model'
import { ChGlyph, curvePath, HullLabel, KeeperGlyph } from './topo-glyphs'

// Conservative visual extents used for zoom-to-fit viewBox computation.
// These are upper bounds: they must be >= actual label extents so nothing clips.
// They intentionally match the contracts in model.ts (chDownExtent etc.) but as
// maximums rather than per-node values, which is fine for viewBox sizing.
const _CH_HALF = CH_R + 34 // chHalfExtent
const _CH_UP = CH_R + 8 // chUpExtent
const _CH_DOWN = CH_R + 57 // chDownExtent worst case (local + FQDN + badge)
const _KP_HALF = KP_R + 16 // keeperHalfExtent
const _KP_UP = KP_R + 22 // keeperUpExtent (leader star)
const _KP_DOWN = KP_R + 42 // keeperDownExtent worst case (FQDN host line)

// Extra room added around the node envelope bounding box to accommodate the
// outermost cluster hull rects (which outset ENVELOPE_MARGIN + rank*NEST_STEP
// past the node content) and cluster label pills below.
const HULL_EXTRA = 120

// Padding (in viewBox units) between the content box and the SVG viewport edge.
const FIT_PAD = 36

// Maximum zoom scale for sparse / single-node topologies. Prevents one node
// filling an entire large canvas (would look unbalanced and hard to read).
const MAX_SCALE = 1.5

// Minimum viewBox size in each dimension (viewBox units). Keeps single-node
// topologies from being blown up beyond MAX_SCALE even if the container is huge.
const MIN_VB_W = VB_W / MAX_SCALE
const MIN_VB_H = 320

/**
 * Compute a tight content-aware viewBox string from the model.
 * Starts from the bounding box of all node visual extents (glyph + labels),
 * expands by HULL_EXTRA to cover cluster boundary rects and label pills, adds
 * FIT_PAD breathing room, enforces minimum dimensions (to cap zoom), and clamps
 * to the full model extent so the viewBox never excludes any content.
 *
 * Returns `"x y w h"` — pass directly to SVG viewBox attribute.
 * `preserveAspectRatio="xMidYMid meet"` on the SVG then centers + scales this
 * box to fill the container div, producing the zoom-to-fit effect.
 */
function contentViewBox(model: TopologyModel): string {
  const { keepers, chNodes, clusterHulls, vbHeight } = model
  if (keepers.length === 0 && chNodes.length === 0) {
    // Empty model: show the whole canvas.
    return `0 0 ${VB_W} ${vbHeight}`
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const k of keepers) {
    minX = Math.min(minX, k.x - _KP_HALF)
    maxX = Math.max(maxX, k.x + _KP_HALF)
    minY = Math.min(minY, k.y - _KP_UP)
    maxY = Math.max(maxY, k.y + _KP_DOWN)
  }
  for (const n of chNodes) {
    minX = Math.min(minX, n.x - _CH_HALF)
    maxX = Math.max(maxX, n.x + _CH_HALF)
    minY = Math.min(minY, n.y - _CH_UP)
    maxY = Math.max(maxY, n.y + _CH_DOWN)
  }
  // Extend for cluster hull rects and label pills (they outset past the node
  // envelopes and can have pills pushed below). Use labelY from each hull to
  // capture the actual pill position rather than a fixed offset.
  for (const hull of clusterHulls) {
    maxY = Math.max(maxY, hull.labelY + 20) // pill height ~19px
  }
  minX -= HULL_EXTRA
  maxX += HULL_EXTRA
  minY -= HULL_EXTRA
  maxY += HULL_EXTRA

  // Pad for breathing room.
  minX -= FIT_PAD
  maxX += FIT_PAD
  minY -= FIT_PAD
  maxY += FIT_PAD

  let w = maxX - minX
  let h = maxY - minY

  // Enforce minimum box dimensions (caps effective zoom at MAX_SCALE for small
  // or single-node topologies so they render balanced, not blown up).
  if (w < MIN_VB_W) {
    const extra = (MIN_VB_W - w) / 2
    minX -= extra
    maxX += extra
    w = MIN_VB_W
  }
  if (h < MIN_VB_H) {
    const extra = (MIN_VB_H - h) / 2
    minY -= extra
    maxY += extra
    h = MIN_VB_H
  }

  // Clamp to the full model extent so we never show outside the drawn canvas.
  // (The dot pattern fills 0…vbHeight, so clamping keeps it consistent.)
  minX = Math.max(minX, -FIT_PAD)
  minY = Math.max(minY, -FIT_PAD)
  maxX = Math.min(maxX, VB_W + FIT_PAD)
  maxY = Math.min(maxY, vbHeight + FIT_PAD)
  w = maxX - minX
  h = maxY - minY

  return `${Math.round(minX)} ${Math.round(minY)} ${Math.round(w)} ${Math.round(h)}`
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

  const vb = contentViewBox(model)

  return (
    <svg
      viewBox={vb}
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
