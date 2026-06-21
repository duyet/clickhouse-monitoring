import type { QueryConfig } from '@/types/query-config'

import { estimateColumnSizes } from './column-defs'
import { describe, expect, test } from 'bun:test'

/**
 * Builds a minimal QueryConfig for the sizing heuristic. estimateColumnSizes
 * only reads `columns` and `columnSizing`, so the rest is cast away.
 */
function config(
  overrides: Partial<QueryConfig> & { name: string }
): QueryConfig {
  return {
    sql: 'SELECT 1',
    columns: [],
    ...overrides,
  } as QueryConfig
}

// Heuristic (kept in sync with estimateColumnSizes):
//   estimate = round(maxChars * 7.2 + 96), clamped to [80, 480]
const size = (maxChars: number) =>
  Math.max(80, Math.min(480, Math.round(maxChars * 7.2 + 96)))

describe('estimateColumnSizes', () => {
  test('falls back to the header label length when there is no data', () => {
    const sizes = estimateColumnSizes(
      config({ name: 't', columns: ['id', 'status'] }),
      []
    )
    // 'id' = 2 chars, 'status' = 6 chars
    expect(sizes.id).toBe(size(2))
    expect(sizes.status).toBe(size(6))
  })

  test('widens to the longest sampled cell value', () => {
    const sizes = estimateColumnSizes(
      config({ name: 't', columns: ['name'] }),
      [
        { name: 'short' },
        { name: 'a-much-longer-value-here' }, // 24 chars, beats the 4-char header
        { name: 'mid' },
      ]
    )
    expect(sizes.name).toBe(size(24))
  })

  test('clamps very wide content to the 480px maximum', () => {
    const sizes = estimateColumnSizes(
      config({ name: 't', columns: ['blob'] }),
      [
        { blob: 'x'.repeat(200) }, // round(200*7.2+96) = 1536 → clamped
      ]
    )
    expect(sizes.blob).toBe(480)
  })

  test('skips columns that declare an explicit size', () => {
    const sizes = estimateColumnSizes(
      config({
        name: 't',
        columns: ['id', 'name'],
        columnSizing: { id: { size: 320 } },
      }),
      [{ id: 1, name: 'value' }]
    )
    // 'id' has an explicit size → no estimate; 'name' still estimated.
    expect(sizes).not.toHaveProperty('id')
    expect(sizes.name).toBe(size('value'.length))
  })

  test('still estimates when columnSizing exists but omits size', () => {
    const sizes = estimateColumnSizes(
      config({
        name: 't',
        columns: ['id'],
        columnSizing: { id: { minSize: 40 } },
      }),
      []
    )
    expect(sizes.id).toBe(size('id'.length))
  })

  test('ignores null/undefined cell values when measuring', () => {
    const sizes = estimateColumnSizes(config({ name: 't', columns: ['c'] }), [
      { c: null },
      { c: undefined },
    ])
    // Nothing measurable → header label ('c' = 1 char) drives the width.
    expect(sizes.c).toBe(size(1))
  })

  test('samples large datasets without scanning every row', () => {
    // 1000 rows, with the widest value placed where the 30-sample stride lands.
    const data = Array.from({ length: 1000 }, (_, i) => ({
      v: i === 0 ? 'w'.repeat(40) : 'x',
    }))
    const sizes = estimateColumnSizes(
      config({ name: 't', columns: ['v'] }),
      data
    )
    expect(sizes.v).toBe(size(40))
  })
})
