import { formatCompactNumber, formatNumber } from './format-number'
import { describe, expect, test } from 'bun:test'

describe('formatCompactNumber (Intl compact)', () => {
  test('values under 1000 are shown in full', () => {
    expect(formatCompactNumber(0)).toBe('0')
    expect(formatCompactNumber(999)).toBe('999')
  })

  test('large values use compact notation', () => {
    // Locale-dependent suffix; assert the magnitude letter is present.
    expect(formatCompactNumber(1_234_567)).toMatch(/M$/)
    expect(formatCompactNumber(45_678)).toMatch(/K$/)
  })

  test('negative values below the threshold stay full', () => {
    expect(formatCompactNumber(-500)).toBe('-500')
  })
})

describe('formatNumber', () => {
  test('applies locale grouping', () => {
    // en-like locales group with commas; assert digits are preserved.
    expect(formatNumber(1234567).replace(/[^0-9]/g, '')).toBe('1234567')
  })
})
