import {
  MAX_CELL_VALUE_LENGTH,
  truncateLargeValues,
} from '../truncate-large-values'
import { describe, expect, it } from 'bun:test'

describe('truncateLargeValues', () => {
  it('returns non-array input unchanged', () => {
    expect(truncateLargeValues(null)).toBeNull()
    expect(truncateLargeValues({ a: 1 } as unknown)).toEqual({ a: 1 })
    expect(truncateLargeValues('plain string' as unknown)).toBe('plain string')
  })

  it('leaves short string values alone', () => {
    const rows = [{ id: 1, name: 'alice' }]
    expect(truncateLargeValues(rows)).toEqual(rows)
  })

  it('truncates strings longer than the cap and tags the original length', () => {
    const big = 'x'.repeat(MAX_CELL_VALUE_LENGTH + 500)
    const [row] = truncateLargeValues([{ payload: big }])
    expect(typeof row.payload).toBe('string')
    expect(
      (row.payload as string).startsWith('x'.repeat(MAX_CELL_VALUE_LENGTH))
    ).toBe(true)
    expect(row.payload as string).toContain(
      `(truncated, ${MAX_CELL_VALUE_LENGTH + 500} chars total)`
    )
  })

  it('preserves non-string values as-is', () => {
    const rows = [{ n: 42, b: true, arr: [1, 2, 3], obj: { a: 1 } }]
    expect(truncateLargeValues(rows)).toEqual(rows)
  })

  it('skips row entries that are not plain objects', () => {
    const rows = [null, 'string-row', [1, 2], { ok: 'short' }]
    const [a, b, c, d] = truncateLargeValues(rows as unknown[])
    expect(a).toBeNull()
    expect(b).toBe('string-row')
    expect(c).toEqual([1, 2])
    expect(d).toEqual({ ok: 'short' })
  })

  it('respects a custom maxLength override', () => {
    const [row] = truncateLargeValues([{ s: 'abcdef' }], 3)
    expect(row.s).toBe('abc… (truncated, 6 chars total)')
  })
})
