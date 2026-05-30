/**
 * Pure geometry helpers for the topology canvas.
 *
 * Ported from the design prototype (topology.jsx) — convex hull + closed
 * Catmull-Rom spline + a rounded "blob" hull that wraps a set of node centers.
 * No React, no data dependencies, fully deterministic — safe to call inside
 * useMemo so layout is computed once and never on a live tick.
 */

export type Point = [number, number]
export interface Center {
  x: number
  y: number
}

/** Andrew's monotone-chain convex hull. */
export function convexHull(points: Point[]): Point[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
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
  return lower.concat(upper)
}

/** Smooth closed path through points using a Catmull-Rom → bezier conversion. */
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

/**
 * Rounded convex blob wrapping every member node. Works for 1, 2, 3+ nodes by
 * sampling a small ring around each center, hulling all sample points, then
 * smoothing. `pad` controls how far the blob sits outside the node centers.
 */
export function hullPath(centers: Center[], pad: number): string {
  if (centers.length === 0) return ''
  const ring: Point[] = []
  const N = 20
  centers.forEach((c) => {
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      ring.push([c.x + Math.cos(a) * pad, c.y + Math.sin(a) * pad])
    }
  })
  return catmullRomClosed(convexHull(ring))
}
