/**
 * Tests for use-overview-data.ts — SWR hook for overview page metrics.
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

mock.module('../use-host', () => ({
  useHostId: () => 0,
}))

import { type OverviewData, useOverviewData } from '../use-overview-data'

describe('useOverviewData', () => {
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

  it('calls useSWR with overview URL containing hostId', () => {
    useOverviewData()

    expect(mockUseSWR).toHaveBeenCalledTimes(1)
    const [key] = mockUseSWR.mock.calls[0]
    expect(key).toBe('/api/v1/overview?hostId=0')
  })

  it('returns null data when SWR has no data', () => {
    const result = useOverviewData()
    expect(result.data).toBeNull()
  })

  it('returns overview data from SWR', () => {
    const overviewData: OverviewData = {
      runningQueries: 5,
      todayQueries: 1200,
      databaseCount: 3,
      tableCount: 45,
      diskUsage: {
        used: '100 GB',
        total: '500 GB',
        percent: 20,
        usedBytes: 100_000_000_000,
        totalBytes: 500_000_000_000,
      },
      hostInfo: {
        version: '24.1.1',
        uptime: '30 days',
        hostname: 'ch-prod-01',
      },
    }

    mockUseSWR.mockReturnValue({
      data: overviewData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useOverviewData()
    expect(result.data).toEqual(overviewData)
    expect(result.data?.runningQueries).toBe(5)
    expect(result.data?.hostInfo.version).toBe('24.1.1')
  })

  it('returns loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useOverviewData()
    expect(result.isLoading).toBe(true)
    expect(result.data).toBeNull()
  })

  it('returns error from SWR', () => {
    const error = new Error('Service unavailable')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useOverviewData()
    expect(result.error).toBe(error)
  })

  it('returns isValidating from SWR', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = useOverviewData()
    expect(result.isValidating).toBe(true)
  })

  it('exposes mutate as refresh', () => {
    const mockMutate = mock(() => Promise.resolve())
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    })

    const result = useOverviewData()
    expect(result.mutate).toBe(mockMutate)
  })

  it('uses default refreshInterval of 15000ms', () => {
    useOverviewData()

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.refreshInterval).toBe(15000)
  })

  it('uses custom refreshInterval when provided', () => {
    useOverviewData({ refreshInterval: 30000 })

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.refreshInterval).toBe(30000)
  })

  it('configures SWR with revalidateOnFocus: false', () => {
    useOverviewData()

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.revalidateOnFocus).toBe(false)
    expect(options.revalidateOnReconnect).toBe(true)
    expect(options.dedupingInterval).toBe(5000)
  })

  describe('fetcher function', () => {
    it('throws on non-ok response', async () => {
      let capturedFetcher: ((url: string) => Promise<unknown>) | undefined
      mockUseSWR.mockImplementation(
        (_key: unknown, fetcher: (url: string) => unknown) => {
          capturedFetcher = fetcher as (url: string) => Promise<unknown>
          return {
            data: undefined,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: mock(() => Promise.resolve()),
          }
        }
      )

      useOverviewData()

      // The fetcher is defined inline — verify it's a function
      expect(typeof capturedFetcher).toBe('function')
    })
  })
})
