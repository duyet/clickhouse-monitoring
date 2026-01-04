/**
 * Tests for useHosts SWR hook
 * Tests the hosts fetching functionality with SWR caching
 *
 * Note: Since this project doesn't use @testing-library/react,
 * we test the hook's SWR integration by verifying that useSWR
 * is called with the correct parameters.
 */

// Mock the ErrorLogger before importing the hook
jest.mock('@/lib/logger', () => ({
  ErrorLogger: {
    logWarning: jest.fn(),
    logError: jest.fn(),
  },
}))

// Mock React hooks
jest.mock('react', () => {
  const actualReact = jest.requireActual('react')
  return {
    ...actualReact,
    useCallback: (fn: () => void) => fn,
  }
})

// Mock SWR - must be before imports
jest.mock('swr', () => ({
  default: jest.fn(),
  __esModule: true,
}))

describe('useHosts', () => {
  const mockHosts = [
    { id: 0, name: 'Production', host: 'clickhouse.prod.com', user: 'default' },
    { id: 1, name: 'Staging', host: 'clickhouse.staging.com', user: 'admin' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('SWR integration', () => {
    it('should call useSWR with correct cache key', () => {
      const useSWR = require('swr').default

      // Mock SWR to return the data
      const mockSwrResult = {
        data: mockHosts,
        error: undefined,
        isLoading: false,
      }
      useSWR.mockReturnValue(mockSwrResult)

      // Import and call the hook (React hooks are mocked)
      const { useHosts } = require('../use-hosts')
      useHosts()

      // SWR should be called with correct key
      expect(useSWR).toHaveBeenCalledWith(
        '/api/v1/hosts',
        expect.any(Function),
        expect.any(Object)
      )
    })

    it('should configure SWR with correct caching options', () => {
      const useSWR = require('swr').default

      const mockSwrResult = {
        data: mockHosts,
        error: undefined,
        isLoading: false,
      }
      useSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Verify SWR is called with the correct configuration
      expect(useSWR).toHaveBeenCalledWith(
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

    it('should return data from SWR', () => {
      const useSWR = require('swr').default

      const mockSwrResult = {
        data: mockHosts,
        error: undefined,
        isLoading: false,
      }
      useSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = require('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual(mockHosts)
      expect(result.error).toBeUndefined()
      expect(result.isLoading).toBe(false)
    })

    it('should return empty array when data is undefined', () => {
      const useSWR = require('swr').default

      const mockSwrResult = {
        data: undefined,
        error: undefined,
        isLoading: false,
      }
      useSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = require('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual([])
    })

    it('should return error from SWR', () => {
      const useSWR = require('swr').default
      const mockError = new Error('Network error')

      const mockSwrResult = {
        data: undefined,
        error: mockError,
        isLoading: false,
      }
      useSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = require('../use-hosts')
      const result = useHosts()

      expect(result.hosts).toEqual([])
      expect(result.error).toEqual(mockError)
    })

    it('should return loading state from SWR', () => {
      const useSWR = require('swr').default

      const mockSwrResult = {
        data: undefined,
        error: undefined,
        isLoading: true,
      }
      useSWR.mockReturnValue(mockSwrResult)

      const { useHosts } = require('../use-hosts')
      const result = useHosts()

      expect(result.isLoading).toBe(true)
      expect(result.hosts).toEqual([])
    })
  })

  describe('fetcher function', () => {
    it('should fetch from /api/v1/hosts endpoint', async () => {
      const useSWR = require('swr').default

      // Capture the fetcher function
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      useSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Mock successful response
      const mockResponse = {
        success: true,
        data: mockHosts,
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/hosts')
        expect(result).toEqual(mockHosts)
      }
    })

    it('should handle non-OK responses gracefully', async () => {
      const useSWR = require('swr').default
      const { ErrorLogger } = require('@/lib/logger')

      // Capture the fetcher function
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      useSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Mock non-OK response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      })

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(ErrorLogger.logWarning).toHaveBeenCalledWith(
          'Failed to fetch hosts: 500 Internal Server Error',
          { component: 'useHosts' }
        )
      }
    })

    it('should handle JSON parsing errors', async () => {
      const useSWR = require('swr').default
      const { ErrorLogger } = require('@/lib/logger')

      // Capture the fetcher function
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      useSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Mock response that throws on json()
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(ErrorLogger.logError).toHaveBeenCalled()
      }
    })

    it('should handle network errors', async () => {
      const useSWR = require('swr').default
      const { ErrorLogger } = require('@/lib/logger')

      // Capture the fetcher function
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      useSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Mock network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
        expect(ErrorLogger.logError).toHaveBeenCalled()
      }
    })

    it('should return empty array when response success is false', async () => {
      const useSWR = require('swr').default

      // Capture the fetcher function
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      useSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Mock response with success: false
      const mockResponse = {
        success: false,
        data: mockHosts,
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
      }
    })

    it('should return empty array when response data is missing', async () => {
      const useSWR = require('swr').default

      // Capture the fetcher function
      let capturedFetcher: (() => Promise<unknown[]>) | undefined
      useSWR.mockImplementation((_key, fetcher) => {
        capturedFetcher = fetcher as (() => Promise<unknown[]>) | undefined
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
        }
      })

      const { useHosts } = require('../use-hosts')
      useHosts()

      // Mock response without data field
      const mockResponse = {
        success: true,
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      if (capturedFetcher) {
        const result = await capturedFetcher()
        expect(result).toEqual([])
      }
    })
  })
})
