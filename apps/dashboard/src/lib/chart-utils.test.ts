import type { RawRow } from './chart-utils'

import { pivotRows } from './chart-utils'
import { describe, expect, it } from 'bun:test'

describe('pivotRows', () => {
  it('returns empty pivoted and categories for empty input', () => {
    const { pivoted, categories } = pivotRows([])
    expect(pivoted).toEqual([])
    expect(categories).toEqual([])
  })

  it('pivots a single row using avg_value', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:00:00', metric: 'cpu', avg_value: 42 },
    ]
    const { pivoted, categories } = pivotRows(rows)
    expect(categories).toEqual(['cpu'])
    expect(pivoted).toEqual([{ event_time: '2024-01-01 00:00:00', cpu: 42 }])
  })

  it('pivots a single row using usage when avg_value is absent', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:00:00', metric: 'mem', usage: 80 },
    ]
    const { pivoted, categories } = pivotRows(rows)
    expect(categories).toEqual(['mem'])
    expect(pivoted).toEqual([{ event_time: '2024-01-01 00:00:00', mem: 80 }])
  })

  it('prefers avg_value over usage when both are present', () => {
    const rows: RawRow[] = [
      {
        event_time: '2024-01-01 00:00:00',
        metric: 'cpu',
        avg_value: 55,
        usage: 90,
      },
    ]
    const { pivoted } = pivotRows(rows)
    expect(pivoted[0].cpu).toBe(55)
  })

  it('omits metric value when neither avg_value nor usage is defined', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:00:00', metric: 'cpu' },
    ]
    const { pivoted, categories } = pivotRows(rows)
    // metric is added to the set, but value is not placed on entry
    expect(categories).toEqual(['cpu'])
    expect(Object.hasOwn(pivoted[0], 'cpu')).toBe(false)
    expect(pivoted[0].event_time).toBe('2024-01-01 00:00:00')
  })

  it('merges multiple metrics for the same event_time into one row', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:00:00', metric: 'cpu', avg_value: 10 },
      { event_time: '2024-01-01 00:00:00', metric: 'mem', avg_value: 20 },
    ]
    const { pivoted, categories } = pivotRows(rows)
    expect(pivoted).toHaveLength(1)
    expect(pivoted[0]).toEqual({
      event_time: '2024-01-01 00:00:00',
      cpu: 10,
      mem: 20,
    })
    expect(categories).toEqual(['cpu', 'mem'])
  })

  it('creates separate rows for different event_times', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:00:00', metric: 'cpu', avg_value: 10 },
      { event_time: '2024-01-01 00:01:00', metric: 'cpu', avg_value: 20 },
    ]
    const { pivoted } = pivotRows(rows)
    expect(pivoted).toHaveLength(2)
  })

  it('sorts pivoted rows by event_time ascending (lexicographic)', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:02:00', metric: 'cpu', avg_value: 30 },
      { event_time: '2024-01-01 00:00:00', metric: 'cpu', avg_value: 10 },
      { event_time: '2024-01-01 00:01:00', metric: 'cpu', avg_value: 20 },
    ]
    const { pivoted } = pivotRows(rows)
    expect(pivoted.map((r) => r.event_time)).toEqual([
      '2024-01-01 00:00:00',
      '2024-01-01 00:01:00',
      '2024-01-01 00:02:00',
    ])
  })

  it('sorts categories alphabetically', () => {
    const rows: RawRow[] = [
      { event_time: '2024-01-01 00:00:00', metric: 'zebra', avg_value: 1 },
      { event_time: '2024-01-01 00:00:00', metric: 'apple', avg_value: 2 },
      { event_time: '2024-01-01 00:00:00', metric: 'mango', avg_value: 3 },
    ]
    const { categories } = pivotRows(rows)
    expect(categories).toEqual(['apple', 'mango', 'zebra'])
  })

  it('handles multiple timestamps and multiple metrics (full pivot)', () => {
    const rows: RawRow[] = [
      { event_time: 't1', metric: 'cpu', avg_value: 10 },
      { event_time: 't1', metric: 'mem', avg_value: 50 },
      { event_time: 't2', metric: 'cpu', avg_value: 20 },
      { event_time: 't2', metric: 'mem', avg_value: 60 },
    ]
    const { pivoted, categories } = pivotRows(rows)
    expect(categories).toEqual(['cpu', 'mem'])
    expect(pivoted).toHaveLength(2)
    expect(pivoted[0]).toEqual({ event_time: 't1', cpu: 10, mem: 50 })
    expect(pivoted[1]).toEqual({ event_time: 't2', cpu: 20, mem: 60 })
  })

  it('deduplicates repeated metrics (last write wins for same event_time+metric)', () => {
    const rows: RawRow[] = [
      { event_time: 't1', metric: 'cpu', avg_value: 10 },
      { event_time: 't1', metric: 'cpu', avg_value: 99 },
    ]
    const { pivoted, categories } = pivotRows(rows)
    // The metric appears only once in categories (Set dedup)
    expect(categories).toEqual(['cpu'])
    expect(pivoted).toHaveLength(1)
    // Last value written wins
    expect(pivoted[0].cpu).toBe(99)
  })

  it('blocks __proto__ metric key to prevent prototype pollution', () => {
    const rows: RawRow[] = [
      { event_time: 't1', metric: '__proto__', avg_value: 1 },
      { event_time: 't1', metric: 'cpu', avg_value: 42 },
    ]
    const { pivoted, categories } = pivotRows(rows)
    expect(categories).not.toContain('__proto__')
    expect(categories).toEqual(['cpu'])
    expect(pivoted[0].cpu).toBe(42)
  })

  it('blocks constructor metric key', () => {
    const rows: RawRow[] = [
      { event_time: 't1', metric: 'constructor', avg_value: 1 },
      { event_time: 't1', metric: 'cpu', avg_value: 5 },
    ]
    const { categories } = pivotRows(rows)
    expect(categories).not.toContain('constructor')
    expect(categories).toContain('cpu')
  })

  it('blocks prototype metric key', () => {
    const rows: RawRow[] = [
      { event_time: 't1', metric: 'prototype', avg_value: 1 },
      { event_time: 't1', metric: 'mem', avg_value: 7 },
    ]
    const { categories } = pivotRows(rows)
    expect(categories).not.toContain('prototype')
    expect(categories).toContain('mem')
  })

  it('handles avg_value of zero (falsy but defined)', () => {
    const rows: RawRow[] = [{ event_time: 't1', metric: 'cpu', avg_value: 0 }]
    const { pivoted } = pivotRows(rows)
    expect(pivoted[0].cpu).toBe(0)
  })

  it('handles usage of zero (falsy but defined)', () => {
    const rows: RawRow[] = [{ event_time: 't1', metric: 'mem', usage: 0 }]
    const { pivoted } = pivotRows(rows)
    expect(pivoted[0].mem).toBe(0)
  })

  it('handles rows with extra unknown fields without error', () => {
    const rows: RawRow[] = [
      {
        event_time: 't1',
        metric: 'cpu',
        avg_value: 5,
        extra_field: 'ignored',
        another: 123,
      },
    ]
    const { pivoted, categories } = pivotRows(rows)
    expect(categories).toEqual(['cpu'])
    expect(pivoted[0].cpu).toBe(5)
  })

  it('returns stable reference types: pivoted is an array of records', () => {
    const rows: RawRow[] = [{ event_time: 't1', metric: 'x', avg_value: 1 }]
    const { pivoted, categories } = pivotRows(rows)
    expect(Array.isArray(pivoted)).toBe(true)
    expect(Array.isArray(categories)).toBe(true)
    expect(typeof pivoted[0]).toBe('object')
  })
})
