import {
  formatCompactNumber,
  formatQuery,
  formatReadableQuantity,
  formatReadableSecondDuration,
  formatReadableSize,
} from './format-readable'
import { describe, expect, test } from 'bun:test'

describe('formatReadableSize', () => {
  test('zero / falsy bytes render as "0 Bytes"', () => {
    expect(formatReadableSize(0)).toBe('0 Bytes')
    expect(formatReadableSize(Number.NaN)).toBe('0 Bytes')
  })

  test('scales through binary units (1024-based)', () => {
    expect(formatReadableSize(1024)).toBe('1 KiB')
    expect(formatReadableSize(1024 * 1024)).toBe('1 MiB')
    expect(formatReadableSize(1536)).toBe('1.5 KiB')
  })

  test('honors the decimals argument', () => {
    expect(formatReadableSize(1536, 0)).toBe('2 KiB')
    expect(formatReadableSize(1536, 3)).toBe('1.5 KiB')
  })

  test('negative sizes keep their sign', () => {
    expect(formatReadableSize(-1024)).toBe('-1 KiB')
  })

  test('caps at the largest unit', () => {
    expect(formatReadableSize(1024 ** 9)).toContain('YiB')
  })
})

describe('formatReadableQuantity', () => {
  test('short preset uses compact notation', () => {
    expect(formatReadableQuantity(123456789)).toBe('123M')
  })

  test('long preset uses grouped standard notation', () => {
    expect(formatReadableQuantity(123456789, 'long')).toBe('123,456,789')
  })
})

describe('formatCompactNumber (K/M/B suffix)', () => {
  test('non-positive / non-finite collapses to "0"', () => {
    expect(formatCompactNumber(0)).toBe('0')
    expect(formatCompactNumber(-5)).toBe('0')
    expect(formatCompactNumber(Number.POSITIVE_INFINITY)).toBe('0')
  })

  test('thresholds at K / M / B with one decimal', () => {
    expect(formatCompactNumber(999)).toBe('999')
    expect(formatCompactNumber(13247)).toBe('13.2K')
    expect(formatCompactNumber(1_400_000)).toBe('1.4M')
    expect(formatCompactNumber(2_500_000_000)).toBe('2.5B')
  })
})

describe('formatReadableSecondDuration', () => {
  test('sub-second is "0s"', () => {
    expect(formatReadableSecondDuration(0.4)).toBe('0s')
  })

  test('under a minute shows seconds', () => {
    expect(formatReadableSecondDuration(45)).toBe('45s')
  })

  test('a minute or more shows minutes and seconds', () => {
    expect(formatReadableSecondDuration(90)).toBe('1m 30s')
    expect(formatReadableSecondDuration(60)).toBe('1m 0s')
  })
})

describe('formatQuery', () => {
  test('collapses whitespace and trims by default', () => {
    expect(formatQuery({ query: '  SELECT\n  1,\n  2  ' })).toBe('SELECT 1, 2')
  })

  test('comment_remove strips block comments', () => {
    expect(
      formatQuery({ query: '/* hint */ SELECT 1', comment_remove: true })
    ).toBe('SELECT 1')
  })

  test('truncate appends an ellipsis past the limit', () => {
    expect(formatQuery({ query: 'SELECT abcdef', truncate: 6 })).toBe(
      'SELECT...'
    )
  })

  test('trim:false preserves original spacing', () => {
    expect(formatQuery({ query: 'a\nb', trim: false })).toBe('a\nb')
  })
})
