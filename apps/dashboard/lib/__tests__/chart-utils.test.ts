import { pivotRows, type RawRow } from '../chart-utils'
import { describe, expect, it } from 'bun:test'

describe('pivotRows', () => {
  it('returns empty pivoted/categories for empty input', () => {
    expect(pivotRows([])).toEqual({ pivoted: [], categories: [] })
  })

  it('pivots long-form rows into wide-form keyed by event_time', () => {
    const rows: RawRow[] = [
      { event_time: '2026-01-01T00:00:00', metric: 'cpu', avg_value: 50 },
      { event_time: '2026-01-01T00:00:00', metric: 'mem', avg_value: 80 },
      { event_time: '2026-01-01T01:00:00', metric: 'cpu', avg_value: 60 },
    ]

    const { pivoted } = pivotRows(rows)

    expect(pivoted).toHaveLength(2)
    expect(pivoted[0]).toEqual({
      event_time: '2026-01-01T00:00:00',
      cpu: 50,
      mem: 80,
    })
    expect(pivoted[1]).toEqual({
      event_time: '2026-01-01T01:00:00',
      cpu: 60,
    })
  })

  it('sorts categories alphabetically', () => {
    const rows: RawRow[] = [
      { event_time: 't', metric: 'zeta', avg_value: 1 },
      { event_time: 't', metric: 'alpha', avg_value: 2 },
      { event_time: 't', metric: 'mu', avg_value: 3 },
    ]

    const { categories } = pivotRows(rows)

    expect(categories).toEqual(['alpha', 'mu', 'zeta'])
  })

  it('falls back to usage when avg_value is undefined', () => {
    const rows: RawRow[] = [{ event_time: 't', metric: 'cpu', usage: 42 }]

    const { pivoted } = pivotRows(rows)

    expect(pivoted[0]).toEqual({ event_time: 't', cpu: 42 })
  })

  it('prefers avg_value over usage when both are present', () => {
    const rows: RawRow[] = [
      { event_time: 't', metric: 'cpu', avg_value: 10, usage: 99 },
    ]

    const { pivoted } = pivotRows(rows)

    expect(pivoted[0].cpu).toBe(10)
  })

  it('drops rows whose metric is a prototype-polluting key', () => {
    const rows: RawRow[] = [
      { event_time: 't', metric: '__proto__', avg_value: 1 },
      { event_time: 't', metric: 'constructor', avg_value: 2 },
      { event_time: 't', metric: 'prototype', avg_value: 3 },
      { event_time: 't', metric: 'ok', avg_value: 4 },
    ]

    const { pivoted, categories } = pivotRows(rows)

    expect(categories).toEqual(['ok'])
    expect(pivoted[0]).toEqual({ event_time: 't', ok: 4 })
  })

  it('sorts pivoted rows by event_time lexicographically', () => {
    const rows: RawRow[] = [
      { event_time: '2026-01-03', metric: 'a', avg_value: 3 },
      { event_time: '2026-01-01', metric: 'a', avg_value: 1 },
      { event_time: '2026-01-02', metric: 'a', avg_value: 2 },
    ]

    const { pivoted } = pivotRows(rows)

    expect(pivoted.map((p) => p.event_time)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ])
  })
})
