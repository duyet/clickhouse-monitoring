import { formatCompactNumber, formatNumber } from '../format-number'
import { describe, expect, it } from 'bun:test'

describe('formatCompactNumber', () => {
  it('renders numbers below 1000 as locale-formatted plain numbers', () => {
    // toLocaleString() with no args returns the default-locale integer form.
    expect(formatCompactNumber(0)).toBe((0).toLocaleString())
    expect(formatCompactNumber(123)).toBe((123).toLocaleString())
    expect(formatCompactNumber(999)).toBe((999).toLocaleString())
  })

  it('switches to compact notation at and above 1000', () => {
    // The exact string depends on the runtime locale, but compact notation
    // should contain a unit suffix letter (K/M/B/T or locale equivalent).
    expect(formatCompactNumber(1500)).toMatch(/[A-Za-z]/)
    expect(formatCompactNumber(2_000_000)).toMatch(/[A-Za-z]/)
  })

  it('handles negative values symmetrically (compact above |1000|)', () => {
    expect(formatCompactNumber(-500)).toBe((-500).toLocaleString())
    expect(formatCompactNumber(-2_000_000)).toMatch(/[A-Za-z]/)
  })
})

describe('formatNumber', () => {
  it('returns a locale-formatted integer string', () => {
    expect(formatNumber(0)).toBe((0).toLocaleString())
    expect(formatNumber(1234567)).toBe((1234567).toLocaleString())
  })

  it('returns a locale-formatted negative integer string', () => {
    expect(formatNumber(-42)).toBe((-42).toLocaleString())
  })
})
