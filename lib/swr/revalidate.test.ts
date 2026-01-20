import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock mutate from 'swr' package at module level
const mockMutate = mock(() => Promise.resolve(undefined))

mock.module('swr', () => ({
  mutate: mockMutate,
}))

// Import AFTER mock is set up
import {
  revalidateAllData,
  revalidateByPattern,
  revalidateCharts,
  revalidateTables,
} from './revalidate'

describe('revalidate', () => {
  afterEach(() => {
    mockMutate.mockClear()
  })

  describe('revalidateAllData', () => {
    it('should call mutate with correct params', async () => {
      await revalidateAllData()

      expect(mockMutate).toHaveBeenCalledWith(
        true,
        undefined,
        { revalidate: true }
      )
    })

    it('should return promise', async () => {
      const result = revalidateAllData()
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('revalidateCharts', () => {
    it('should call mutate with correct params for charts', async () => {
      await revalidateCharts()

      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: true }
      )
    })

    it('should use correct pattern matcher for charts', async () => {
      const matcher = (key: unknown) => {
        return typeof key === 'string' && (key as string).startsWith('/api/v1/charts')
      }

      // Capture the matcher function passed to mutate
      mockMutate.mockImplementation((callback) => {
        const mockKey = '/api/v1/charts/query-count'
        const shouldRevalidate = (callback as (key: unknown) => boolean)(mockKey)
        expect(shouldRevalidate).toBe(true)
        return Promise.resolve(undefined)
      })

      await revalidateCharts()

      // Reset to default implementation
      mockMutate.mockReset()
    })
  })

  describe('revalidateTables', () => {
    it('should call mutate with correct params for tables', async () => {
      await revalidateTables()

      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: true }
      )
    })

    it('should use correct pattern matcher for tables', async () => {
      const matcher = (key: unknown) => {
        return typeof key === 'string' && (key as string).startsWith('/api/v1/tables')
      }

      // Capture the matcher function
      mockMutate.mockImplementation((callback) => {
        const mockKey = '/api/v1/tables/overview'
        const shouldRevalidate = (callback as (key: unknown) => boolean)(mockKey)
        expect(shouldRevalidate).toBe(true)
        return Promise.resolve(undefined)
      })

      await revalidateTables()

      mockMutate.mockReset()
    })
  })

  describe('revalidateByPattern', () => {
    it('should call mutate with pattern matcher', async () => {
      await revalidateByPattern('/api/test')

      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Function),
        undefined,
        { revalidate: true }
      )
    })

    it('should match string keys containing pattern', async () => {
      // Capture the matcher function
      const matchedKeys: string[] = []

      mockMutate.mockImplementation((callback) => {
        const testKeys = [
          '/api/v1/test/data',
          '/api/v1/test/metrics',
          '/api/v1/other/data',
        ]

        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            matchedKeys.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/test')

      expect(matchedKeys).toEqual([
        '/api/v1/test/data',
        '/api/v1/test/metrics',
      ])
      expect(matchedKeys).not.toContain('/api/v1/other/data')
    })

    it('should match array keys where first element matches pattern', async () => {
      const matchedKeys: unknown[] = []

      mockMutate.mockImplementation((callback) => {
        const testKeys = [
          ['/api/v1/test', 'query-count', 0],
          ['/api/v1/other', 'data', 1],
        ]

        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            matchedKeys.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/test')

      expect(matchedKeys).toHaveLength(1)
      expect(matchedKeys[0]).toEqual(['/api/v1/test', 'query-count', 0])
    })

    it('should not match array keys where first element does not match pattern', async () => {
      const matchedKeys: unknown[] = []

      mockMutate.mockImplementation((callback) => {
        const testKeys = [
          ['/api/v1/other', 'data', 1],
          ['/api/v1/test', 'query-count', 0],
        ]

        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            matchedKeys.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/test')

      expect(matchedKeys).toHaveLength(1)
      expect(matchedKeys[0]).toEqual(['/api/v1/test', 'query-count', 0])
    })

    it('should handle empty array keys', async () => {
      const matchedKeys: unknown[] = []

      mockMutate.mockImplementation((callback) => {
        const testKeys: unknown[] = [[]]
        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            matchedKeys.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/test')

      expect(matchedKeys).toHaveLength(0)
    })

    it('should not match non-array string keys', async () => {
      const matchedKeys: unknown[] = []

      mockMutate.mockImplementation((callback) => {
        const testKeys = ['/api/v1/test', 'query-count']
        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            matchedKeys.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/v1')

      // Array keys won't match pattern starting with '/api/v1/test'
      expect(matchedKeys).toHaveLength(0)
    })

    it('should handle multiple patterns', async () => {
      const firstMatched: unknown[] = []
      const secondMatched: unknown[] = []

      // First pattern match
      mockMutate.mockImplementation((callback) => {
        const testKeys = ['/api/v1/test/data', 'query-count']
        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            firstMatched.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/v1/test')
      mockMutate.mockClear()

      // Second pattern match
      mockMutate.mockImplementation((callback) => {
        const testKeys = ['/api/v1/other/data', 'metrics']
        testKeys.forEach((key) => {
          const shouldRevalidate = (callback as (key: unknown) => boolean)(key)
          if (shouldRevalidate) {
            secondMatched.push(key)
          }
        })

        return Promise.resolve(undefined)
      })

      await revalidateByPattern('/api/v1/other')
      mockMutate.mockClear()

      expect(firstMatched).toEqual(['/api/v1/test/data', 'query-count'])
      expect(secondMatched).toEqual(['/api/v1/other/data', 'metrics'])
    })
  })
})

// Clean up mocks after all tests
afterAll(() => {
  mock.restore()
})
