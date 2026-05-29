import { formatCompact } from '../chart-format'
import { describe, expect, it } from 'bun:test'

describe('formatCompact', () => {
  it('renders values below 1000 as locale-formatted integers when integer', () => {
    expect(formatCompact(0)).toBe((0).toLocaleString())
    expect(formatCompact(42)).toBe((42).toLocaleString())
    expect(formatCompact(999)).toBe((999).toLocaleString())
  })

  it('renders non-integer sub-1000 values with two decimals', () => {
    expect(formatCompact(0.5)).toBe('0.50')
    expect(formatCompact(123.456)).toBe('123.46')
  })

  it('switches to K notation at and above 1000', () => {
    expect(formatCompact(1000)).toBe('1.0K')
    expect(formatCompact(45_678)).toBe('45.7K')
    expect(formatCompact(999_999)).toBe('1000.0K')
  })

  it('switches to M notation at and above 1_000_000', () => {
    expect(formatCompact(1_000_000)).toBe('1.0M')
    expect(formatCompact(2_345_678)).toBe('2.3M')
  })

  it('handles negative values symmetrically (via Math.abs)', () => {
    expect(formatCompact(-2_345_678)).toBe('-2.3M')
    expect(formatCompact(-45_678)).toBe('-45.7K')
    expect(formatCompact(-42)).toBe((-42).toLocaleString())
    expect(formatCompact(-0.5)).toBe('-0.50')
  })
})
