import {
  type Center,
  convexHull,
  offsetHullArea,
  offsetHullPath,
} from '../geometry'
import { describe, expect, it } from 'bun:test'

const R = 40

/** A path is "closed" when it ends in Z and starts with a move command. */
function isClosedPath(d: string): boolean {
  return /^M/.test(d.trim()) && /Z\s*$/.test(d.trim())
}

describe('offsetHullPath — degenerate shapes', () => {
  it('0 nodes → empty path', () => {
    expect(offsetHullPath([], R)).toBe('')
  })

  it('1 node → a closed circle path of arcs', () => {
    const d = offsetHullPath([{ x: 100, y: 100 }], R)
    expect(d).not.toBe('')
    expect(isClosedPath(d)).toBe(true)
    // a circle is two A arcs
    expect((d.match(/A /g) ?? []).length).toBe(2)
  })

  it('2 nodes → a closed stadium/capsule (two arcs + two lines)', () => {
    const d = offsetHullPath(
      [
        { x: 100, y: 100 },
        { x: 300, y: 100 },
      ],
      R
    )
    expect(isClosedPath(d)).toBe(true)
    expect((d.match(/A /g) ?? []).length).toBe(2)
    expect((d.match(/L /g) ?? []).length).toBe(2)
  })

  it('all-collinear N nodes → still a single capsule (segment hull)', () => {
    const collinear: Center[] = [0, 1, 2, 3, 4].map((i) => ({
      x: 50 + i * 60,
      y: 200,
    }))
    const d = offsetHullPath(collinear, R)
    expect(isClosedPath(d)).toBe(true)
    // segment hull → exactly two end caps
    expect((d.match(/A /g) ?? []).length).toBe(2)
  })

  it('coincident nodes collapse to a single circle', () => {
    const d = offsetHullPath(
      [
        { x: 100, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 100 },
      ],
      R
    )
    expect((d.match(/A /g) ?? []).length).toBe(2)
  })

  it('3+ non-collinear → rounded polygon: one corner arc per hull vertex', () => {
    const tri: Center[] = [
      { x: 100, y: 100 },
      { x: 300, y: 120 },
      { x: 180, y: 320 },
    ]
    const d = offsetHullPath(tri, R)
    expect(isClosedPath(d)).toBe(true)
    const hull = convexHull(tri.map((c) => [c.x, c.y]))
    expect((d.match(/A /g) ?? []).length).toBe(hull.length)
  })

  it('R <= 0 → empty path (nothing to draw)', () => {
    expect(offsetHullPath([{ x: 0, y: 0 }], 0)).toBe('')
  })
})

describe('offsetHullArea — monotonic + ordering', () => {
  it('area grows with member spread', () => {
    const tight = offsetHullArea(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      R
    )
    const wide = offsetHullArea(
      [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
      ],
      R
    )
    expect(wide).toBeGreaterThan(tight)
  })

  it('single point area ≈ disk πr²', () => {
    const a = offsetHullArea([{ x: 5, y: 5 }], R)
    expect(a).toBeCloseTo(Math.PI * R * R, 1)
  })
})

describe('determinism', () => {
  it('same input → identical path string', () => {
    const pts: Center[] = [
      { x: 12, y: 80 },
      { x: 200, y: 40 },
      { x: 340, y: 220 },
      { x: 90, y: 260 },
    ]
    expect(offsetHullPath(pts, R)).toBe(offsetHullPath(pts, R))
  })
})
