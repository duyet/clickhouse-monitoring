/**
 * Tests for useHosts SWR hook
 * Tests the hosts fetching functionality with SWR caching
 *
 * Note: Since this project doesn't use @testing-library/react,
 * we test the hook's SWR integration by verifying that useSWR
 * is called with the correct parameters.
 */

import {
  beforeEach as bunBeforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test'

// Mock the ErrorLogger before importing the hook
const mockLogWarning = mock(() => {})
const mockLogError = mock(() => {})

mock.module('@/lib/logger', () => ({
  ErrorLogger: {
    logWarning: mockLogWarning,
    logError: mockLogError,
  },
}))

// Mock React hooks - React's useCallback just returns the function in test environment
const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useCallback: (fn: () => void) => fn,
}))

// Mock SWR - must be before imports
const mockUseSWR = mock(() => ({
  data: undefined,
  error: undefined,
  isLoading: false,
}))

mock.module('swr', () => ({
  default: mockUseSWR,
  __esModule: true,
}))

describe('useHosts', () => {
  const mockHosts = [
    { id: 0, name: 'Production', host: 'clickhouse.prod.com', user: 'default' },
    { id: 1, name: 'Staging', host: 'clickhouse.staging.com', user: 'admin' },
  ]

  bunBeforeEach(() => {
    mockUseSWR.mockReset()
    mockLogWarning.mockReset()
    mockLogError.mockReset()
  })

  describe('SWR integration', () => {
    it('should call useSWR with correct cache key', async () => {
      // Mock SWR to return the data
      const mockSwrResult = {
        data: mockHosts,
        error: undefined,
        isLoading: false,
      }
      mockUseSWR.mockReturnValue(mockSwrResult)

      // Import and call the hook (React hooks are mocked)
      const { useHosts } = await import('../use-hosts')
      useHosts()

      // SWR should be called with correct key
      expect(mockUseSWR).toHaveBeenCalledWith(
        '/api/v1/hosts',
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('should configure SWR with correct caching options', async () => {
      const mockSwrResult = {
        data: mockHosts,
        error: undefined,
        isLoading: false,
      }
      mockUseSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = await import('../use-hosts')
      useHosts()

      // Verify SWR is called with the correct configuration
      expect(mockUseSWR).toHaveBeenCalledWith(
        '/api/v1/hosts',
        expect.any(Function),
        expect.objectContaining({
          // Cache for 5 minutes since hosts list rarely changes
          dedupingInterval: 300000,
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
        })
      )
    })

    it('should return data from SWR', async () => {
      const mockSwrResult = {
        data: mockHosts,
        error: undefined,
        isLoading: false,
      }
      mockUseSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual(mockHosts)
      expect(result.error).toBeUndefined()
      expect(result.isLoading).toBe(false)
    })

    it('should return empty array when data is undefined', async () => {
      const mockSwrResult = {
        data: undefined,
        error: undefined,
        isLoading: false,
      }
      mockUseSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual([])
    })

    it('should return error from SWR', async () => {
      const mockError = new Error('Network error')

      const mockSwrResult = {
        data: undefined,
        error: mockError,
        isLoading: false,
      }
      mockUseSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual([])
      expect(result.error).toEqual(mockError)
    })

    it('should return loading state from SWR', async () => {
      const mockSwrResult = {
        data: undefined,
        error: undefined,
        isLoading: true,
      }
      mockUseSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = await import('../use-hosts')
      const result = useHosts()

      expect(result.isLoading).toBe(true)
      expect(result.hosts).toEqual([])
    })
  })

  describe('fetcher function', () => {
    it('should fetch from /api/v1/hosts endpoint', async () => {
      // Capture the fetcher function
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
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        })
      )
      global.fetch = mockFetch

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/hosts')
        expect(result).toEqual(mockHosts)
      }
    })

    it('should handle non-OK responses gracefully', async () => {
      // Capture the fetcher function
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

      // Mock non-OK response
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({}),
        })
      )
      global.fetch = mockFetch

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
      // Capture the fetcher function
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

      // Mock response that throws on json()
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON')
          },
        })
      )
      global.fetch = mockFetch

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(mockLogError).toHaveBeenCalled()
      }
    })

    it('should handle network errors', async () => {
      // Capture the fetcher function
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

      // Mock network error
      const mockFetch = mock(() => Promise.reject(new Error('Network error')))
      global.fetch = mockFetch

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(mockLogError).toHaveBeenCalled()
      }
    })

    it('should return empty array when response success is false', async () => {
      // Capture the fetcher function
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

      // Mock response with success: false
      const mockResponse = {
        success: false,
        data: mockHosts,
      }
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        })
      )
      global.fetch = mockFetch

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
      }
    })

    it('should return empty array when response data is missing', async () => {
      // Capture the fetcher function
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

      // Mock response without data field
      const mockResponse = {
        success: true,
      }
      const mockFetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        })
      )
      global.fetch = mockFetch

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
      }
    })
  })
})
