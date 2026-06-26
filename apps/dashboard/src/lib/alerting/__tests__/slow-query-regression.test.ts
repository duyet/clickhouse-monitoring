/**
 * Slow Query Regression Tests
 */

import { describe, expect, test } from 'bun:test'
import {
  normalizeQueryFingerprint,
  summarizeRegressions,
  type SlowQueryRegression,
} from '../slow-query-regression'

// ---------------------------------------------------------------------------
// normalizeQueryFingerprint
// ---------------------------------------------------------------------------

describe('normalizeQueryFingerprint', () => {
  test('strips numeric literals', () => {
    const q = 'SELECT * FROM t WHERE id = 42 AND age > 18'
    const fp = normalizeQueryFingerprint(q)
    expect(fp).not.toContain('42')
    expect(fp).not.toContain('18')
    expect(fp).toContain('?')
  })

  test('strips string literals', () => {
    const q = "SELECT * FROM t WHERE name = 'Alice'"
    const fp = normalizeQueryFingerprint(q)
    expect(fp).not.toContain('Alice')
    expect(fp).toContain("'?'")
  })

  test('strips bind parameters', () => {
    const q = 'SELECT * FROM t WHERE host = {host:String} AND id = {id:UInt64}'
    const fp = normalizeQueryFingerprint(q)
    expect(fp).not.toContain('{host:String}')
    expect(fp).not.toContain('{id:UInt64}')
  })

  test('collapses IN lists', () => {
    const q = 'SELECT * FROM t WHERE id IN (1, 2, 3, 4, 5)'
    const fp = normalizeQueryFingerprint(q)
    expect(fp).toContain('in (?)')
    expect(fp).not.toContain('1, 2, 3')
  })

  test('normalizes whitespace', () => {
    const q = 'SELECT   *   FROM   t'
    expect(normalizeQueryFingerprint(q)).toBe('select * from t')
  })

  test('lowercases output', () => {
    const q = 'SELECT COUNT(*) FROM MyTable'
    expect(normalizeQueryFingerprint(q)).toBe(
      normalizeQueryFingerprint(q).toLowerCase()
    )
  })

  test('same structure → same fingerprint regardless of literal values', () => {
    const q1 = "SELECT * FROM t WHERE id = 1 AND name = 'foo'"
    const q2 = "SELECT * FROM t WHERE id = 99 AND name = 'bar'"
    expect(normalizeQueryFingerprint(q1)).toBe(normalizeQueryFingerprint(q2))
  })

  test('different structure → different fingerprint', () => {
    const q1 = 'SELECT id FROM t'
    const q2 = 'SELECT name FROM t'
    expect(normalizeQueryFingerprint(q1)).not.toBe(
      normalizeQueryFingerprint(q2)
    )
  })
})

// ---------------------------------------------------------------------------
// summarizeRegressions
// ---------------------------------------------------------------------------

describe('summarizeRegressions', () => {
  const makeRow = (
    factor: number,
    fp = 'select * from t'
  ): SlowQueryRegression => ({
    fingerprint: fp,
    fingerprint_short: fp.slice(0, 200),
    current_count: 10,
    current_p95_ms: Math.round(1000 * factor),
    current_avg_ms: Math.round(800 * factor),
    baseline_count: 10,
    baseline_p95_ms: 1000,
    baseline_avg_ms: 800,
    regression_factor: factor,
  })

  test('returns null for empty array', () => {
    expect(summarizeRegressions([])).toBeNull()
  })

  test('returns summary for single regression', () => {
    const summary = summarizeRegressions([makeRow(3)])
    expect(summary).not.toBeNull()
    expect(summary?.count).toBe(1)
    expect(summary?.worst_factor).toBe(3)
  })

  test('picks worst factor across multiple regressions', () => {
    const rows = [makeRow(2, 'q1'), makeRow(5, 'q2'), makeRow(3, 'q3')]
    const summary = summarizeRegressions(rows)
    expect(summary?.count).toBe(3)
    expect(summary?.worst_factor).toBe(5)
    expect(summary?.worst_fingerprint).toBe('q2')
  })
})
