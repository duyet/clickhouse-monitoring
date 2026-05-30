/**
 * Tests for useHosts SWR hook
 * Tests the hosts fetching functionality with SWR caching
 *
 * Tests the SWR integration by verifying that useSWR
 * is called with the correct parameters.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock SWR before any imports that use it
const mockUseSWR = mock(() => ({
  data: undefined,
  error: undefined,
  isLoading: false,
}))

mock.module('swr', () => ({
  default: mockUseSWR,
}))

// Mock the ErrorLogger before importing the hook
const mockLogWarning = mock(() => {})
const mockLogError = mock(() => {})

mock.module('@chm/logger', () => ({
  ErrorLogger: {
    logWarning: mockLogWarning,
    logError: mockLogError,
  },
}))

// Mock apiFetch to control responses in fetcher tests
const mockApiFetch = mock(async () => ({
  ok: true,
  json: async () => ({ success: true, data: [] }),
}))

mock.module('../api-fetch', () => ({
  apiFetch: mockApiFetch,
}))

// Mock React hooks. `mock.module('react')` is global AND persists across files
// in the aggregated `bun test` run, so spread the real module — otherwise every
// later test file loses `forwardRef`/`createContext`/etc. and breaks.
const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useCallback: (fn: () => unknown) => fn,
}))

describe('useHosts', () => {
  const mockHosts = [
    { id: 0, name: 'Production', host: 'clickhouse.prod.com', user: 'default' },
    { id: 1, name: 'Staging', host: 'clickhouse.staging.com', user: 'admin' },
  ]

  beforeEach(() => {
    mockUseSWR.mockReset()
    mockApiFetch.mockReset()
    mockLogWarning.mockReset()
    mockLogError.mockReset()

    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    })
  })

  describe('SWR integration', () => {
    it('should call useSWR with correct cache key', async () => {
      mockUseSWR.mockReturnValue({
        data: mockHosts,
        error: undefined,
        isLoading: false,
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      expect(mockUseSWR).toHaveBeenCalledWith(
        '/api/v1/hosts',
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('should configure SWR with correct caching options', async () => {
      mockUseSWR.mockReturnValue({
        data: mockHosts,
        error: undefined,
        isLoading: false,
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      expect(mockUseSWR).toHaveBeenCalledWith(
        '/api/v1/hosts',
        expect.any(Function),
        expect.objectContaining({
          dedupingInterval: 300000,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
        })
      )
    })

    it('should return data from SWR', async () => {
      mockUseSWR.mockReturnValue({
        data: mockHosts,
        error: undefined,
        isLoading: false,
      })

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual(mockHosts)
      expect(result.error).toBeUndefined()
      expect(result.isLoading).toBe(false)
    })

    it('should return empty array when data is undefined', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: false,
      })

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual([])
    })

    it('should return error from SWR', async () => {
      const mockError = new Error('Network error')

      mockUseSWR.mockReturnValue({
        data: undefined,
        error: mockError,
        isLoading: false,
      })

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual([])
      expect(result.error).toEqual(mockError)
    })

    it('should return loading state from SWR', async () => {
      mockUseSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
      })

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.isLoading).toBe(true)
      expect(result.hosts).toEqual([])
    })
  })

  describe('fetcher function', () => {
    it('should fetch from /api/v1/hosts endpoint', async () => {
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      mockUseSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      // Mock successful response
      const mockResponse = {
        success: true,
        data: mockHosts,
      }
      mockApiFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => mockResponse,
      }))

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/hosts')
        expect(result).toEqual(mockHosts)
      }
    })

    it('should handle non-OK responses gracefully', async () => {
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      mockUseSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      mockApiFetch.mockImplementation(async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }))

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(mockLogWarning).toHaveBeenCalledWith(
          'Failed to fetch hosts: 500 Internal Server Error',
          { component: 'useHosts' }
        )
      }
    })

    it('should handle JSON parsing errors', async () => {
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      mockUseSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      mockApiFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      }))

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(mockLogError).toHaveBeenCalled()
      }
    })

    it('should handle network errors', async () => {
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      mockUseSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      mockApiFetch.mockImplementation(async () => {
        throw new Error('Network error')
      })

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(mockLogError).toHaveBeenCalled()
      }
    })

    it('should return empty array when response success is false', async () => {
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      mockUseSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      mockApiFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({ success: false, data: mockHosts }),
      }))

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
      }
    })

    it('should return empty array when response data is missing', async () => {
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      mockUseSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = await import('../use-hosts')
      useHosts()

      mockApiFetch.mockImplementation(async () => ({
        ok: true,
        json: async () => ({ success: true }),
      }))

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
      }
    })
  })
})
