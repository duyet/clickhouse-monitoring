/**
 * Tests for revalidate.ts — SWR cache revalidation utilities.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock SWR mutate before importing
const mockMutate = mock(() => Promise.resolve())
mock.module('swr', () => ({
  mutate: mockMutate,
}))

import {
  revalidateAllData,
  revalidateByPattern,
  revalidateCharts,
  revalidateTables,
} from '../revalidate'

describe('revalidate', () => {
  beforeEach(() => {
    mockMutate.mockClear()
  })

  describe('revalidateAllData', () => {
    it('calls mutate with a matcher that matches all keys', async () => {
      await revalidateAllData()

      expect(mockMutate).toHaveBeenCalledTimes(1)
      const [matcher] = mockMutate.mock.calls[0]
      // The matcher function should return true for any key
      expect(matcher('any-key')).toBe(true)
      expect(matcher(['/api/v1/charts', 'test'])).toBe(true)
    })

    it('passes revalidate: true option', async () => {
      await revalidateAllData()

      const [, , options] = mockMutate.mock.calls[0]
      expect(options).toEqual({ revalidate: true })
    })
  })

  describe('revalidateCharts', () => {
    it('calls mutate matching /api/v1/charts prefix', async () => {
      await revalidateCharts()

      expect(mockMutate).toHaveBeenCalledTimes(1)
      const [matcher] = mockMutate.mock.calls[0]

      // Should match string keys starting with /api/v1/charts
      expect(matcher('/api/v1/charts/query-count')).toBe(true)
      expect(matcher('/api/v1/charts/memory-usage?hostId=0')).toBe(true)

      // Should match array keys with first element /api/v1/charts
      expect(matcher(['/api/v1/charts', 'query-count', 0])).toBe(true)

      // Should not match other prefixes
      expect(matcher('/api/v1/tables/tables')).toBe(false)
      expect(matcher(['/api/v1/tables', 'tables'])).toBe(false)
      expect(matcher('/api/v1/overview')).toBe(false)
    })

    it('does not match null/undefined keys', async () => {
      await revalidateCharts()

      const [matcher] = mockMutate.mock.calls[0]
      expect(matcher(null)).toBe(false)
      expect(matcher(undefined)).toBe(false)
    })

    it('does not match empty arrays', async () => {
      await revalidateCharts()

      const [matcher] = mockMutate.mock.calls[0]
      expect(matcher([])).toBe(false)
    })
  })

  describe('revalidateTables', () => {
    it('calls mutate matching /api/v1/tables prefix', async () => {
      await revalidateTables()

      expect(mockMutate).toHaveBeenCalledTimes(1)
      const [matcher] = mockMutate.mock.calls[0]

      // Should match string keys starting with /api/v1/tables
      expect(matcher('/api/v1/tables/tables')).toBe(true)
      expect(matcher('/api/v1/tables/running-queries?hostId=0')).toBe(true)

      // Should match array keys
      expect(matcher(['/api/v1/tables', 'tables', 0])).toBe(true)

      // Should not match charts
      expect(matcher('/api/v1/charts/query-count')).toBe(false)
    })
  })

  describe('revalidateByPattern', () => {
    it('matches string keys containing the pattern', async () => {
      await revalidateByPattern('query-count')

      const [matcher] = mockMutate.mock.calls[0]
      expect(matcher('/api/v1/charts/query-count')).toBe(true)
      expect(matcher('/api/v1/charts/other-chart')).toBe(false)
    })

    it('matches array keys where any string part contains the pattern', async () => {
      await revalidateByPattern('tables')

      const [matcher] = mockMutate.mock.calls[0]
      expect(matcher(['/api/v1/tables', 'tables-data'])).toBe(true)
      expect(matcher(['other', 'no-match'])).toBe(false)
    })

    it('returns false for non-string non-array keys', async () => {
      await revalidateByPattern('test')

      const [matcher] = mockMutate.mock.calls[0]
      expect(matcher(123)).toBe(false)
      expect(matcher(null)).toBe(false)
      expect(matcher(undefined)).toBe(false)
    })

    it('returns false for array parts that are not strings', async () => {
      await revalidateByPattern('test')

      const [matcher] = mockMutate.mock.calls[0]
      expect(matcher([123, 456])).toBe(false)
    })
  })
})
