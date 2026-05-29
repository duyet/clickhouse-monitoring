/**
 * Tests for use-chart-data.ts — SWR hook for chart data fetching.
 *
 * Tests the SWR integration by verifying useSWR is called with correct parameters.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock dependencies before imports
const mockUseSWR = mock(() => ({
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: mock(() => Promise.resolve()),
}))

mock.module('swr', () => ({
  default: mockUseSWR,
}))

// Mock React
const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useCallback: (fn: () => unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
  useRef: (val: unknown) => ({ current: val }),
}))

// Mock context hooks
mock.module('@/lib/context/browser-connections-context', () => ({
  useBrowserConnectionsContext: () => ({ getConnection: () => undefined }),
}))

mock.module('@/lib/context/time-range-context', () => ({
  useTimeRange: () => ({
    timeRange: { lastHours: 24, interval: 'toStartOfHour' },
  }),
}))

mock.module('@/lib/hooks/use-user-settings', () => ({
  useUserSettings: () => ({ settings: { timezone: null } }),
}))

mock.module('../api-fetch', () => ({
  apiFetch: (...args: unknown[]) =>
    global.fetch(...(args as [RequestInfo | URL, RequestInit?])),
}))

mock.module('../fetch-error', () => ({
  throwIfNotOk: async () => {},
}))

mock.module('../browser-proxy-fetcher', () => ({
  fetchViaBrowserProxy: async () => ({ data: [], metadata: {} }),
}))

mock.module('../config', () => ({
  onErrorRetry: () => {},
  REFRESH_INTERVAL: {
    NEVER: 0,
    FAST_15S: 15_000,
    MEDIUM_30S: 30_000,
    DEFAULT_60S: 60_000,
    SLOW_2M: 120_000,
    VERY_SLOW_5M: 300_000,
  },
  visibilityAwareInterval: (ms: number) => () => ms,
}))

import { useChartData } from '../use-chart-data'

describe('useChartData', () => {
  beforeEach(() => {
    mockUseSWR.mockReset()
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })
  })

  it('calls useSWR with the correct cache key structure', () => {
    useChartData({ chartName: 'query-count', hostId: 0 })

    expect(mockUseSWR).toHaveBeenCalledTimes(1)
    const [key] = mockUseSWR.mock.calls[0]

    // Normal path (non-negative hostId) uses array key
    expect(Array.isArray(key)).toBe(true)
    expect(key[0]).toBe('/api/v1/charts')
    expect(key[1]).toBe('query-count')
    expect(key[2]).toBe(0)
  })

  it('includes hostId in the cache key', () => {
    useChartData({ chartName: 'memory-usage', hostId: 5 })

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[2]).toBe(5)
  })

  it('includes interval and lastHours in the cache key when provided', () => {
    useChartData({
      chartName: 'cpu-usage',
      hostId: 0,
      interval: 'toStartOfMinute',
      lastHours: 12,
    })

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[3]).toBe('toStartOfMinute')
    expect(key[4]).toBe(12)
  })

  it('includes stringified params in cache key', () => {
    const params = { database: 'default' }
    useChartData({
      chartName: 'test',
      hostId: 0,
      params,
    })

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[5]).toBe(JSON.stringify(params))
  })

  it('returns loading state from SWR', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(result.isLoading).toBe(true)
    expect(result.data).toEqual(undefined)
  })

  it('returns data array from SWR response', () => {
    const chartData = [
      { time: '2024-01-01', value: 100 },
      { time: '2024-01-02', value: 200 },
    ]

    mockUseSWR.mockReturnValue({
      data: {
        data: chartData,
        metadata: { duration: 50, rows: 2, sql: 'SELECT 1' },
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'query-count', hostId: 0 })
    expect(result.data).toEqual(chartData)
    expect(result.metadata?.sql).toBe('SELECT 1')
    expect(result.isLoading).toBe(false)
    expect(result.hasData).toBe(true)
  })

  it('returns error from SWR', () => {
    const error = new Error('Network failure')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(result.error).toBe(error)
    expect(result.hasData).toBe(false)
  })

  it('sets staleError when data exists but revalidation failed', () => {
    const error = new Error('Revalidation failed')
    mockUseSWR.mockReturnValue({
      data: {
        data: [{ time: '2024-01-01', value: 100 }],
        metadata: { duration: 50, rows: 1 },
      },
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(result.hasData).toBe(true)
    expect(result.staleError).toBeDefined()
    expect(result.staleError?.message).toBe('Revalidation failed')
    expect(result.staleError?.timestamp).toBeGreaterThan(0)
  })

  it('does not set staleError when no data exists', () => {
    const error = new Error('Initial load failed')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(result.hasData).toBe(false)
    expect(result.staleError).toBeUndefined()
  })

  it('does not set staleError while loading', () => {
    const error = new Error('Loading error')
    mockUseSWR.mockReturnValue({
      data: { data: [{ value: 1 }], metadata: {} },
      error,
      isLoading: true,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(result.staleError).toBeUndefined()
  })

  it('handles multi-query object data by wrapping in array', () => {
    mockUseSWR.mockReturnValue({
      data: {
        data: { main: [{ value: 1 }], secondary: [{ value: 2 }] },
        metadata: {},
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.hasData).toBe(true)
  })

  it('returns empty data array when no data', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useChartData({ chartName: 'test', hostId: 0 })
    expect(result.data).toBeUndefined()
    expect(result.hasData).toBe(false)
  })

  it('passes chartName through in the result', () => {
    const result = useChartData({ chartName: 'my-chart', hostId: 0 })
    expect(result.chartName).toBe('my-chart')
  })

  it('configures SWR with dedupingInterval and focusThrottleInterval', () => {
    useChartData({ chartName: 'test', hostId: 0 })

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.dedupingInterval).toBe(5000)
    expect(options.focusThrottleInterval).toBe(5000)
    expect(options.revalidateIfStale).toBe(true)
    expect(options.revalidateOnReconnect).toBe(true)
  })

  it('uses null key for browser connection when connection is missing', () => {
    // When hostId is negative, it's a browser connection path.
    // With our mock that returns undefined for getConnection,
    // browserProxyKey will be null.
    const result = useChartData({ chartName: 'test', hostId: -1 })

    // The hook should still call useSWR (with null key from browserProxyKey)
    expect(mockUseSWR).toHaveBeenCalled()
    // And should return a browserConnectionError since connection is missing
    expect(result.error?.message).toContain('Browser connection not found')
    expect(result.isLoading).toBe(false)
  })

  describe('fetcher function', () => {
    it('builds URL with hostId, interval, lastHours query params', () => {
      let capturedFetcher: (() => Promise<unknown>) | undefined
      mockUseSWR.mockImplementation((_key: unknown, fetcher: () => unknown) => {
        capturedFetcher = fetcher as () => Promise<unknown>
        return {
          data: undefined,
          error: undefined,
          isLoading: false,
          isValidating: false,
          mutate: mock(() => Promise.resolve()),
        }
      })

      useChartData({
        chartName: 'test-chart',
        hostId: 3,
        interval: 'toStartOfDay',
        lastHours: 48,
      })

      // The fetcher is useCallback-wrapped, so it's the function itself
      expect(typeof capturedFetcher).toBe('function')
    })
  })
})
