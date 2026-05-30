/**
 * Pure geometry helpers for the topology canvas.
 *
 * The cluster overlay is an OFFSET CONVEX HULL — the Minkowski sum of the convex
 * hull of the member node centers with a disk of radius R. One algorithm covers
 * every cluster shape with no special-casing:
 *
 *   - 1 node           → hull is a point   → a CIRCLE of radius R
 *   - 2 / all-collinear → hull is a segment → a STADIUM / CAPSULE
 *   - 3+ non-collinear  → a rounded convex polygon (offset edges + corner arcs)
 *
 * Each hull EDGE is translated outward by R (parallel offset); each hull VERTEX
 * is replaced by a circular ARC of radius R sweeping the exterior angle. The
 * result is emitted as a single closed SVG path (L lines + A arc segments).
 *
 * No React, no data dependencies, fully deterministic — safe to call inside
 * useMemo so layout is computed once and never on a live tick.
 */

export type Point = [number, number]
export interface Center {
  x: number
  y: number
}

const EPS = 1e-9

/** Andrew's monotone-chain convex hull. Returns CCW hull vertices.
 *
 * Notes:
 *  - Deduplicates identical points so coincident centers collapse to a point.
 *  - For < 3 unique points returns the unique points (a point or a segment).
 */
export function convexHull(points: Point[]): Point[] {
  // Use a precision high enough that sub-pixel differences (~0.00005 in a
  // 770×560 viewBox) are not collapsed, while still merging true duplicates
  // from floating-point arithmetic noise.
  const seen = new Set<string>()
  const pts: Point[] = []
  for (const p of points) {
    const k = `${p[0]},${p[1]}`
    if (!seen.has(k)) {
      seen.add(k)
      pts.push(p)
    }
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return pts

  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

  const lower: Point[] = []
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: Point[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  const hull = lower.concat(upper)
  // Collinear set can collapse to 2 endpoints — keep them as a segment.
  if (hull.length < 2)
    return pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : pts
  return hull
}

/** Smooth closed path through points using a Catmull-Rom → bezier conversion.
 * Retained for any caller that wants a smooth blob through points; the cluster
 * overlay now uses {@link offsetHullPath} instead. */
export function catmullRomClosed(p: Point[]): string {
  const n = p.length
  if (n < 3) return ''
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n]
    const p1 = p[i]
    const p2 = p[(i + 1) % n]
    const p3 = p[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return `${d} Z`
}

const f = (n: number) => n.toFixed(1)

/** Full-circle path (used when the hull degenerates to a single point). */
function circlePath(cx: number, cy: number, r: number): string {
  // Two half-arcs form a full circle (a single A 360° arc is undefined in SVG).
  return (
    `M ${f(cx - r)} ${f(cy)} ` +
    `A ${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)} ` +
    `A ${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)} Z`
  )
}

/** Stadium/capsule path: the Minkowski sum of a segment a→b with a disk of r. */
function stadiumPath(a: Point, b: Point, r: number): string {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  if (len < EPS) return circlePath(a[0], a[1], r)
  // Unit normal (left side). The two offset lines sit ±r·n from the segment.
  const nx = -dy / len
  const ny = dx / len
  const ox = nx * r
  const oy = ny * r
  // Walk: a+offset → b+offset, semicircle around b, b−offset → a−offset, semicircle around a.
  const a1: Point = [a[0] + ox, a[1] + oy]
  const b1: Point = [b[0] + ox, b[1] + oy]
  const b2: Point = [b[0] - ox, b[1] - oy]
  const a2: Point = [a[0] - ox, a[1] - oy]
  // sweep=1 wraps the cap on the correct (exterior) side for this winding.
  return (
    `M ${f(a1[0])} ${f(a1[1])} ` +
    `L ${f(b1[0])} ${f(b1[1])} ` +
    `A ${f(r)} ${f(r)} 0 0 1 ${f(b2[0])} ${f(b2[1])} ` +
    `L ${f(a2[0])} ${f(a2[1])} ` +
    `A ${f(r)} ${f(r)} 0 0 1 ${f(a1[0])} ${f(a1[1])} Z`
  )
}

/**
 * Offset convex hull as a single closed SVG path: the Minkowski sum of the
 * convex hull of `centers` with a disk of radius `r`.
 *
 *   0 centers → '' (nothing to draw)
 *   1 center  → circle r
 *   2 / collinear → stadium
 *   3+        → straight offset edges joined by r corner arcs
 *
 * Pure + deterministic.
 */
export function offsetHullPath(centers: Center[], r: number): string {
  if (centers.length === 0 || r <= 0) return ''
  const pts: Point[] = centers.map((c) => [c.x, c.y])
  const hull = convexHull(pts)

  if (hull.length === 1) return circlePath(hull[0][0], hull[0][1], r)
  if (hull.length === 2) return stadiumPath(hull[0], hull[1], r)

  // hull is CCW. For each vertex i, the outward-offset endpoints of its two
  // incident edges are joined by a convex (left-turn) arc of radius r.
  const n = hull.length
  // Per edge i (hull[i] → hull[i+1]): outward unit normal.
  const edgeNormal: Point[] = []
  for (let i = 0; i < n; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % n]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    // For a CCW polygon the outward normal is (dy, -dx)/len.
    edgeNormal.push([dy / len, -dx / len])
  }

  // Offset endpoints. For vertex v shared by edge (v-1 → v) and (v → v+1):
  //   arrival point  = v + r * normal(edge ending at v)   = edge (i-1)
  //   departure point= v + r * normal(edge starting at v) = edge (i)
  let d = ''
  for (let i = 0; i < n; i++) {
    const v = hull[i]
    const nPrev = edgeNormal[(i - 1 + n) % n]
    const nNext = edgeNormal[i]
    const arrive: Point = [v[0] + r * nPrev[0], v[1] + r * nPrev[1]]
    const depart: Point = [v[0] + r * nNext[0], v[1] + r * nNext[1]]
    if (i === 0) {
      d += `M ${f(arrive[0])} ${f(arrive[1])} `
    } else {
      d += `L ${f(arrive[0])} ${f(arrive[1])} `
    }
    // Corner arc from arrive→depart, radius r, sweeping the exterior (CCW → sweep 1).
    d += `A ${f(r)} ${f(r)} 0 0 1 ${f(depart[0])} ${f(depart[1])} `
  }
  return `${d}Z`
}

/** Signed-area-based polygon area of the convex hull of `centers` PLUS the
 * offset band, used to z-order overlapping blobs (largest drawn first/behind).
 * Deterministic; approximate (good enough for ordering). */
export function offsetHullArea(centers: Center[], r: number): number {
  if (centers.length === 0) return 0
  const hull = convexHull(centers.map((c) => [c.x, c.y] as Point))
  if (hull.length === 1) return Math.PI * r * r
  if (hull.length === 2) {
    const len = Math.hypot(hull[1][0] - hull[0][0], hull[1][1] - hull[0][1])
    // stadium = rectangle (len × 2r) + circle (πr²)
    return len * 2 * r + Math.PI * r * r
  }
  // polygon area (shoelace) + perimeter*r + πr² (exact Minkowski area)
  let area2 = 0
  let perim = 0
  const n = hull.length
  for (let i = 0; i < n; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % n]
    area2 += a[0] * b[1] - b[0] * a[1]
    perim += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return Math.abs(area2) / 2 + perim * r + Math.PI * r * r
}

/**
 * Smooth blob hull matching the design spec: sample a ring of points around
 * each center, compute the convex hull of all samples, then smooth with
 * Catmull-Rom. Produces the organic "territory" shapes shown in the mockup.
 * Handles 1 node (circle), 2 (capsule), and 3+ (smooth blob) naturally.
 */
export function hullPath(centers: Center[], pad: number): string {
  if (centers.length === 0 || pad <= 0) return ''
  // Degenerate: single center → return a circle directly (catmullRom needs ≥3).
  if (centers.length === 1) {
    return circlePath(centers[0].x, centers[0].y, pad)
  }

  // Sample a ring of points around each center, then hull + smooth.
  const RING_N = 20
  const ring: Point[] = []
  for (const c of centers) {
    for (let i = 0; i < RING_N; i++) {
      const a = (i / RING_N) * Math.PI * 2
      ring.push([c.x + Math.cos(a) * pad, c.y + Math.sin(a) * pad])
    }
  }
  const hull = convexHull(ring)
  if (hull.length < 3) return offsetHullPath(centers, pad) // fallback
  return catmullRomClosed(hull)
}
