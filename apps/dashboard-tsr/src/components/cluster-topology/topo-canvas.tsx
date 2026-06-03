import type { ChNode, KeeperNode, TopologyModel } from './model'

import { CH_R, KP_R, STATUS_COLOR, VB_W } from './model'

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

// ── ClickHouse brand colors (theme-independent — the logo is self-colored) ──
const CH_YELLOW = '#FAFF00'
const CH_RED = '#FF1F00'

function clampPct(v: number): number {
  return Math.max(0, Math.min(1, v || 0))
}

/** Truncate an id so it fits inside the glyph; the full host shows below it. */
function fit(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/**
 * Bound a host label's width so long FQDNs
 * (`chi-...-0-0.clickhouse.svc.cluster.local`) don't sprawl past their cluster
 * boundary into neighbours — keeps the meaningful head + tail with a middle
 * ellipsis. ~24 chars ≈ the `chHalfExtent` the layout reserves. The full host is
 * still available on hover (a <title>) and in the inspector.
 */
function truncateMiddle(s: string, max = 24): string {
  if (s.length <= max) return s
  const head = Math.ceil((max - 1) / 2)
  const tail = Math.floor((max - 1) / 2)
  return `${s.slice(0, head)}…${s.slice(s.length - tail)}`
}

/**
 * The official ClickHouse logo mark, drawn in its native 9×8 unit grid then
 * scaled + centered at (0,0): four full-height yellow bars (x = 0,2,4,6), a red
 * square at the foot of the first bar, and a short bar at x = 8. Width `w`.
 */
function ChLogo({ w, muted }: { w: number; muted?: boolean }) {
  const s = w / 9 // unit size
  const h = 8 * s
  return (
    <g
      transform={`translate(${(-w / 2).toFixed(2)} ${(-h / 2).toFixed(2)}) scale(${s.toFixed(3)})`}
      opacity={muted ? 0.32 : 1}
      style={{ filter: muted ? 'grayscale(1)' : undefined }}
    >
      <rect x="0" y="7" width="1" height="1" fill={CH_RED} />
      <rect x="0" y="0" width="1" height="7" fill={CH_YELLOW} />
      <rect x="2" y="0" width="1" height="8" fill={CH_YELLOW} />
      <rect x="4" y="0" width="1" height="8" fill={CH_YELLOW} />
      <rect x="6" y="0" width="1" height="8" fill={CH_YELLOW} />
      <rect x="8" y="3.25" width="1" height="1.5" fill={CH_YELLOW} />
    </g>
  )
}

/** Pointy-top regular hexagon path of "radius" r centered at the origin. */
function hexPath(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90)
    pts.push(`${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

/** A gently curved connector between two points — softer than a straight line.
 * The control point is offset perpendicular to the chord by a capped fraction
 * of its length, so every edge bows consistently. */
function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const bend = Math.min(46, len * 0.16)
  const cx = (x1 + x2) / 2 - (dy / len) * bend
  const cy = (y1 + y2) / 2 + (dx / len) * bend
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

/** A small keeper/coordination shield mark. */
const ShieldMark = ({ color }: { color: string }) => (
  <path
    transform="translate(0 -1)"
    d="M 0 -7 L 6.5 -3.6 v 5 c 0 4.4 -3.3 7.1 -6.5 8.2 c -3.2 -1.1 -6.5 -3.8 -6.5 -8.2 v -5 Z"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    opacity="0.8"
  />
)

// Shared label sub-line below a node glyph.
function NodeLabel({
  r,
  host,
  id,
  sub,
}: {
  r: number
  host: string
  id: string
  sub: string
}) {
  // Dedupe: the id is already shown inside the glyph; only repeat the full host
  // below when it carries more than the short id (e.g. an FQDN).
  const showHost = host !== id
  const subY = showHost ? r + 31 : r + 16
  return (
    <>
      {showHost && (
        <text
          textAnchor="middle"
          y={r + 16}
          fontSize="11.5"
          fontWeight="600"
          fill="var(--foreground)"
          stroke="var(--card)"
          strokeWidth="3"
          paintOrder="stroke"
          className="font-mono"
        >
          <title>{host}</title>
          {truncateMiddle(host)}
        </text>
      )}
      <text
        textAnchor="middle"
        y={subY}
        fontSize="10.5"
        fill="var(--muted-foreground)"
        stroke="var(--card)"
        strokeWidth="2.5"
        paintOrder="stroke"
        className="font-mono"
      >
        {sub}
      </text>
    </>
  )
}

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
  const side = r * 2
  const statusCol = STATUS_COLOR[node.status]
  const unreachable = node.status === 'unreachable'
  const cpu = live?.cpuPct ?? null
  const meterCol =
    cpu !== null
      ? cpu > 85
        ? STATUS_COLOR.down
        : cpu > 60
          ? STATUS_COLOR.warn
          : 'hsl(217 91% 60%)'
      : statusCol
  const sub = unreachable
    ? 'unreachable'
    : cpu !== null
      ? `cpu ${Math.round(cpu)}%${
          live?.memPct !== null && live?.memPct !== undefined
            ? ` · mem ${Math.round(live.memPct)}%`
            : ''
        }`
      : node.errors > 0
        ? `${node.errors} error${node.errors === 1 ? '' : 's'}`
        : node.isLocal
          ? 'local node'
          : 'remote node'

  // CPU meter geometry (a thin bar inside the card's lower edge).
  const meterW = side - 24
  const meterPct = cpu !== null ? clampPct(cpu / 100) : 0
  const idText = fit(node.id, 13)

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      tabIndex={0}
      role="button"
      aria-label={`ClickHouse node ${idText}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onSelect(node.id)
        }
      }}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.25 : unreachable ? 0.72 : 1,
        transition: 'opacity .25s',
        outline: 'none',
      }}
    >
      {/* current (connected) node: a persistent breathing ring so the node this
          dashboard is talking to is always identifiable, independent of selection. */}
      {node.isLocal && (
        <rect
          className="topo-current-ring"
          x={-r - 5}
          y={-r - 5}
          width={side + 10}
          height={side + 10}
          rx="17"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
        />
      )}
      {selected && (
        <rect
          x={-r - 7}
          y={-r - 7}
          width={side + 14}
          height={side + 14}
          rx="18"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          opacity="0.9"
        />
      )}
      {/* status glow keeps the card visible over the dotted grid in dark mode */}
      <rect
        x={-r}
        y={-r}
        width={side}
        height={side}
        rx="13"
        fill={statusCol}
        fillOpacity="0.1"
      />
      {/* the server card */}
      <rect
        x={-r}
        y={-r}
        width={side}
        height={side}
        rx="13"
        fill="var(--card)"
        fillOpacity="0.97"
        stroke={statusCol}
        strokeOpacity={unreachable ? 0.9 : 0.85}
        strokeWidth="2"
        strokeDasharray={unreachable ? '4 4' : undefined}
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.18))' }}
      />
      {/* ClickHouse brand mark — instantly identifies a ClickHouse server */}
      <g transform={`translate(0 ${-r * 0.36})`}>
        <ChLogo w={r * 0.7} muted={unreachable} />
      </g>
      {/* short node id, inside the card */}
      <text
        textAnchor="middle"
        y={r * 0.42}
        fontSize="12"
        fontWeight="700"
        fill="var(--foreground)"
        className="font-mono"
      >
        {idText}
      </text>
      {/* live CPU meter along the card's lower edge */}
      <g transform={`translate(0 ${r - 11})`}>
        <rect
          x={-meterW / 2}
          y="0"
          width={meterW}
          height="3.5"
          rx="1.75"
          fill="var(--muted-foreground)"
          fillOpacity="0.18"
        />
        {cpu !== null && (
          <rect
            x={-meterW / 2}
            y="0"
            width={Math.max(2, meterW * meterPct)}
            height="3.5"
            rx="1.75"
            fill={meterCol}
            style={{ transition: 'width .6s ease' }}
          />
        )}
      </g>
      {/* status dot at the top-right corner */}
      <circle
        cx={r - 4}
        cy={-r + 4}
        r="5.5"
        fill={statusCol}
        stroke="var(--card)"
        strokeWidth="2"
      />
      <NodeLabel r={r} host={node.host} id={idText} sub={sub} />
      {node.isLocal && (
        <g transform={`translate(0 ${r + (node.host !== idText ? 40 : 25)})`}>
          <rect
            x="-22"
            y="0"
            width="44"
            height="15"
            rx="7.5"
            fill="var(--primary)"
            fillOpacity="0.12"
            stroke="var(--primary)"
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <text
            textAnchor="middle"
            y="10.5"
            fontSize="8.5"
            fontWeight="700"
            fill="var(--primary)"
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
  const accent = isLeader ? STATUS_COLOR.warn : statusCol
  const sub = `${node.role} · ${node.avgLatency != null ? `${node.avgLatency.toFixed(1)}ms` : '—'}`
  const d = hexPath(r)
  const idText = fit(node.id, 11)

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      tabIndex={0}
      role="button"
      aria-label={`Keeper node ${idText}`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onSelect(node.id)
        }
      }}
      style={{
        cursor: 'pointer',
        opacity: dimmed ? 0.25 : 1,
        transition: 'opacity .25s',
        outline: 'none',
      }}
    >
      {selected && (
        <path
          d={hexPath(r + 8)}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          opacity="0.9"
        />
      )}
      {/* status glow */}
      <path d={d} fill={accent} fillOpacity="0.12" />
      {/* the hexagon body */}
      <path
        d={d}
        fill="var(--card)"
        fillOpacity="0.97"
        stroke={accent}
        strokeWidth={isLeader ? 2.5 : 2}
        strokeOpacity="0.9"
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.18))' }}
      />
      {/* coordination shield in the upper band */}
      <g transform={`translate(0 ${-r * 0.44})`}>
        <ShieldMark color={accent} />
      </g>
      {/* node id, inside the wide middle band of the hexagon */}
      <text
        textAnchor="middle"
        y={r * 0.24}
        fontSize="11.5"
        fontWeight="700"
        fill="var(--foreground)"
        className="font-mono"
      >
        {idText}
      </text>
      {/* connection status dot at the upper-right vertex */}
      <circle
        cx={r * 0.72}
        cy={-r * 0.5}
        r="5"
        fill={statusCol}
        stroke="var(--card)"
        strokeWidth="2"
      />
      {isLeader && (
        <text
          textAnchor="middle"
          y={-r - 7}
          fontSize="15"
          fill={STATUS_COLOR.warn}
        >
          ★
        </text>
      )}
      <NodeLabel r={r} host={node.host} id={idText} sub={sub} />
    </g>
  )
}

/** A rounded label chip rendered over a hull so the name stays readable. Every
 * cluster — logical or physical — gets the same solid-bordered pill in its own
 * color; the physical/logical distinction lives in the toggle, not the pill. */
function HullLabel({
  x,
  y,
  text,
  color,
}: {
  x: number
  y: number
  text: string
  color: string
}) {
  const h = 19
  const w = text.length * 7 + 20
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* rect + text both centered on (x, y) so the label sits dead-center */}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill="var(--card)"
        fillOpacity="0.95"
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11.5"
        fontWeight="700"
        fill={color}
        className="font-mono"
        style={{ letterSpacing: '0.01em' }}
      >
        {text}
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
