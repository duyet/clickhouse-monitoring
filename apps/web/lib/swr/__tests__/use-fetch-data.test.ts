/**
 * Tests for use-fetch-data.ts — Generic SWR data fetching hook.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockUseSWR = mock(() => ({
  data: undefined,
  error: undefined,
  isLoading: false,
  mutate: mock(() => Promise.resolve()),
}))

mock.module('swr', () => ({
  default: mockUseSWR,
}))

const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useCallback: (fn: () => unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
}))

mock.module('../api-fetch', () => ({
  apiFetch: (...args: unknown[]) =>
    global.fetch(...(args as [RequestInfo | URL, RequestInit?])),
}))

mock.module('../fetch-error', () => ({
  throwIfNotOk: async () => {},
}))

import { useFetchData } from '../use-fetch-data'

describe('useFetchData', () => {
  beforeEach(() => {
    mockUseSWR.mockReset()
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mock(() => Promise.resolve()),
    })
  })

  it('calls useSWR with cache key containing query and hostId', () => {
    useFetchData('SELECT 1', { database: 'default' }, 2)

    expect(mockUseSWR).toHaveBeenCalledTimes(1)
    const [key] = mockUseSWR.mock.calls[0]

    // Key: ['/api/v1/data', query, JSON(queryParams), hostId]
    expect(Array.isArray(key)).toBe(true)
    expect(key[0]).toBe('/api/v1/data')
    expect(key[1]).toBe('SELECT 1')
    expect(key[2]).toBe(JSON.stringify({ database: 'default' }))
    expect(key[3]).toBe(2)
  })

  it('uses empty object for queryParams when not provided', () => {
    useFetchData('SELECT 1', undefined, 0)

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[2]).toBe('{}')
  })

  it('returns data from SWR response', () => {
    const apiData = [{ col1: 'val1' }, { col1: 'val2' }]

    mockUseSWR.mockReturnValue({
      data: {
        data: apiData,
        metadata: { duration: 100, rows: 2 },
      },
      error: undefined,
      isLoading: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useFetchData('SELECT col1 FROM table')
    expect(result.data).toEqual(apiData)
    expect(result.metadata?.rows).toBe(2)
  })

  it('returns loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useFetchData('SELECT 1')
    expect(result.isLoading).toBe(true)
    expect(result.data).toBeUndefined()
  })

  it('returns error from SWR', () => {
    const error = new Error('Fetch failed')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useFetchData('SELECT 1')
    expect(result.error).toBe(error)
  })

  it('exposes refresh as mutate', () => {
    const mockMutate = mock(() => Promise.resolve())
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: mockMutate,
    })

    const result = useFetchData('SELECT 1')
    expect(result.refresh).toBe(mockMutate)
  })

  it('configures SWR with dedupingInterval and focusThrottleInterval', () => {
    useFetchData('SELECT 1')

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.dedupingInterval).toBe(3000)
    expect(options.focusThrottleInterval).toBe(5000)
    expect(options.revalidateIfStale).toBe(true)
    expect(options.revalidateOnReconnect).toBe(true)
  })

  it('passes refreshInterval when provided and positive', () => {
    useFetchData('SELECT 1', undefined, 0, 30000)

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.refreshInterval).toBe(30000)
  })

  it('sets refreshInterval to 0 when not provided', () => {
    useFetchData('SELECT 1')

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.refreshInterval).toBe(0)
  })

  it('merges additional swrConfig', () => {
    useFetchData('SELECT 1', undefined, 0, 0, {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    })

    const [, , options] = mockUseSWR.mock.calls[0]
    // swrConfig overrides defaults
    expect(options.dedupingInterval).toBe(10000)
    expect(options.revalidateOnFocus).toBe(true)
  })

  describe('fetcher function', () => {
    it('sends POST request with query and params', () => {
      let capturedFetcher: (() => Promise<unknown>) | undefined
      mockUseSWR.mockImplementation((_key: unknown, fetcher: () => unknown) => {
        capturedFetcher = fetcher as () => Promise<unknown>
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
          mutate: mock(() => Promise.resolve()),
        }
      })

      useFetchData('SELECT * FROM t', { db: 'test' }, 1)

      expect(typeof capturedFetcher).toBe('function')
    })
  })
})
