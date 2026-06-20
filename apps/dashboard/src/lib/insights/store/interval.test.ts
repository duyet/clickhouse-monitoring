/**
 * Tests for the shared "since" interval parser used by the non-ClickHouse
 * insight backends. The grammar must match ClickHouse's INTERVAL units so every
 * backend honors the same recency windows, and must reject malformed input
 * (defense in depth alongside the ClickHouse path's sanitizeSince).
 */

import { intervalToMs } from './interval'
import { describe, expect, test } from 'bun:test'

describe('intervalToMs', () => {
  test('parses each supported unit', () => {
    expect(intervalToMs('1 SECOND')).toBe(1000)
    expect(intervalToMs('1 MINUTE')).toBe(60_000)
    expect(intervalToMs('1 HOUR')).toBe(3_600_000)
    expect(intervalToMs('1 DAY')).toBe(86_400_000)
    expect(intervalToMs('1 WEEK')).toBe(604_800_000)
    expect(intervalToMs('1 MONTH')).toBe(2_592_000_000)
  })

  test('multiplies by the quantity', () => {
    expect(intervalToMs('6 HOUR')).toBe(6 * 3_600_000)
    expect(intervalToMs('30 DAY')).toBe(30 * 86_400_000)
  })

  test('is case-insensitive and trims, accepts plural', () => {
    expect(intervalToMs('  6 hours ')).toBe(6 * 3_600_000)
    expect(intervalToMs('2 Days')).toBe(2 * 86_400_000)
  })

  test('returns null for malformed input', () => {
    expect(intervalToMs('')).toBeNull()
    expect(intervalToMs('HOUR')).toBeNull()
    expect(intervalToMs('6')).toBeNull()
    expect(intervalToMs('-6 HOUR')).toBeNull()
    expect(intervalToMs('6 FORTNIGHT')).toBeNull()
    expect(intervalToMs('6 HOUR; DROP TABLE')).toBeNull()
    expect(intervalToMs('999999 HOUR')).toBeNull() // > 5 digits
  })
})
