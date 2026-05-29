/**
 * Tests for use-table-data.ts — SWR hook for table data fetching.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

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

const actualReact = await import('react')

mock.module('react', () => ({
  ...actualReact,
  useCallback: (fn: () => unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
  useRef: (val: unknown) => ({ current: val }),
}))

mock.module('@/lib/types/browser-connection', () => ({
  BROWSER_CONNECTIONS_STORAGE_KEY: 'clickhouse-monitor-browser-connections',
}))

mock.module('@/lib/context/browser-connections-context', () => ({
  useBrowserConnectionsContext: () => ({ getConnection: () => undefined }),
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
  visibilityAwareInterval: (ms: number) => () => ms,
}))

import { useTableData } from '../use-table-data'

describe('useTableData', () => {
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

  it('calls useSWR with correct cache key structure', () => {
    useTableData('tables', 0)

    expect(mockUseSWR).toHaveBeenCalledTimes(1)
    const [key] = mockUseSWR.mock.calls[0]

    expect(Array.isArray(key)).toBe(true)
    expect(key[0]).toBe('/api/v1/tables')
    expect(key[1]).toBe('tables')
    expect(key[2]).toBe(0)
  })

  it('includes hostId in the cache key', () => {
    useTableData('running-queries', 5)

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[2]).toBe(5)
  })

  it('includes searchParams in cache key', () => {
    const searchParams = { search: 'log', page: 1, limit: 50 }
    useTableData('tables', 0, searchParams)

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[3]).toBe(JSON.stringify(searchParams))
  })

  it('returns loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.isLoading).toBe(true)
    expect(result.data).toEqual([])
  })

  it('returns table data from SWR', () => {
    const rows = [
      { name: 'table1', rows: 100 },
      { name: 'table2', rows: 200 },
    ]

    mockUseSWR.mockReturnValue({
      data: {
        data: rows,
        metadata: { duration: 50, rows: 2, rows_before_limit_at_least: 100 },
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.data).toEqual(rows)
    expect(result.metadata?.rows_before_limit_at_least).toBe(100)
    expect(result.hasData).toBe(true)
  })

  it('returns error from SWR', () => {
    const error = new Error('Connection refused')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.error).toBe(error)
    expect(result.hasData).toBe(false)
  })

  it('returns empty array when data is undefined', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.data).toEqual([])
  })

  it('sets staleError when data exists but revalidation failed', () => {
    const error = new Error('Revalidation failed')
    mockUseSWR.mockReturnValue({
      data: {
        data: [{ name: 'table1' }],
        metadata: {},
      },
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.hasData).toBe(true)
    expect(result.staleError).toBeDefined()
    expect(result.staleError?.message).toBe('Revalidation failed')
    expect(result.staleError?.timestamp).toBeGreaterThan(0)
  })

  it('does not set staleError when loading', () => {
    const error = new Error('Error')
    mockUseSWR.mockReturnValue({
      data: { data: [{ name: 't1' }], metadata: {} },
      error,
      isLoading: true,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.staleError).toBeUndefined()
  })

  it('does not set staleError when no data', () => {
    const error = new Error('No data error')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useTableData('tables', 0)
    expect(result.hasData).toBe(false)
    expect(result.staleError).toBeUndefined()
  })

  it('exposes refresh as mutate', () => {
    const mockMutate = mock(() => Promise.resolve())
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    })

    const result = useTableData('tables', 0)
    expect(result.refresh).toBe(mockMutate)
  })

  it('configures SWR with correct defaults', () => {
    useTableData('tables', 0)

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.dedupingInterval).toBe(3000)
    expect(options.focusThrottleInterval).toBe(5000)
    expect(options.revalidateIfStale).toBe(true)
  })

  it('returns browser connection error when hostId is negative and connection missing', () => {
    const result = useTableData('tables', -1)
    expect(result.error?.message).toContain('Browser connection not found')
    expect(result.isLoading).toBe(false)
  })

  it('uses refresh interval when provided', () => {
    useTableData('tables', 0, undefined, 30000)

    const [, , options] = mockUseSWR.mock.calls[0]
    // visibilityAwareInterval is mocked to return () => ms
    // so refreshInterval should be a function
    expect(typeof options.refreshInterval).toBe('function')
  })

  it('uses refresh interval 0 when not provided', () => {
    useTableData('tables', 0)

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.refreshInterval).toBe(0)
  })
})
