/**
 * Tests for common helper utilities.
 */

import { extractNestedData, formatReadWritePair } from '../transforms/common'

describe('extractNestedData', () => {
  it('should return undefined for empty array', () => {
    expect(extractNestedData([], 'used')).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(extractNestedData(undefined, 'used')).toBeUndefined()
  })

  it('should return undefined for non-object first item', () => {
    expect(extractNestedData([null], 'used')).toBeUndefined()
    expect(extractNestedData(['string'], 'used')).toBeUndefined()
  })

  it('should return undefined for missing key', () => {
    expect(extractNestedData([{ other: [] }], 'used')).toBeUndefined()
  })

  it('should return undefined for non-array value', () => {
    expect(extractNestedData([{ used: 'string' }], 'used')).toBeUndefined()
    expect(extractNestedData([{ used: null }], 'used')).toBeUndefined()
  })

  it('should extract nested array', () => {
    const nestedData = [{ id: 1 }, { id: 2 }]
    const result = extractNestedData<{ id: number }>([{ used: nestedData }], 'used')

    expect(result).toEqual(nestedData)
  })

  it('should handle empty nested array', () => {
    const result = extractNestedData([{ used: [] }], 'used')

    expect(result).toEqual([])
  })
})

describe('formatReadWritePair', () => {
  it('should format with read smaller', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 200, readable: '200' }
    )

    expect(result.current).toBe(100)
    expect(result.target).toBe(200)
    expect(result.currentReadable).toBe('100 read')
    expect(result.targetReadable).toBe('200 written')
  })

  it('should format with write smaller', () => {
    const result = formatReadWritePair(
      { value: 200, readable: '200' },
      { value: 100, readable: '100' }
    )

    expect(result.current).toBe(100)
    expect(result.target).toBe(200)
    expect(result.currentReadable).toBe('100 written')
    expect(result.targetReadable).toBe('200 read')
  })

  it('should format with equal values', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 100, readable: '100' }
    )

    // When equal, write is shown as current (consistent with logic)
    expect(result.current).toBe(100)
    expect(result.target).toBe(100)
  })

  it('should include unit suffix when provided', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 200, readable: '200' },
      'bytes'
    )

    expect(result.currentReadable).toBe('100 bytes read')
    expect(result.targetReadable).toBe('200 bytes written')
  })

  it('should handle empty unit string', () => {
    const result = formatReadWritePair(
      { value: 100, readable: '100' },
      { value: 200, readable: '200' },
      ''
    )

    expect(result.currentReadable).toBe('100 read')
    expect(result.targetReadable).toBe('200 written')
  })
})
