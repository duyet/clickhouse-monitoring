/**
 * Tests for use-peerdb-data.ts — SWR hook for PeerDB proxy data.
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
}))

mock.module('../config', () => ({
  visibilityAwareInterval: (ms: number) => () => ms,
}))

import { usePeerDB } from '../use-peerdb-data'

describe('usePeerDB', () => {
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

  it('calls useSWR with peerdb key containing path', () => {
    usePeerDB('/mirrors/list')

    expect(mockUseSWR).toHaveBeenCalledTimes(1)
    const [key] = mockUseSWR.mock.calls[0]

    expect(Array.isArray(key)).toBe(true)
    expect(key[0]).toBe('peerdb')
    expect(key[1]).toBe('/mirrors/list')
    expect(key[2]).toBe('GET') // No body = GET
  })

  it('normalizes path without leading slash', () => {
    usePeerDB('mirrors/list')

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[1]).toBe('/mirrors/list')
  })

  it('uses null key when path is null (disabled)', () => {
    usePeerDB(null)

    const [key] = mockUseSWR.mock.calls[0]
    expect(key).toBeNull()
  })

  it('uses POST method when body is provided', () => {
    usePeerDB('/mirrors/status', { body: { mirrorId: 'abc' } })

    const [key] = mockUseSWR.mock.calls[0]
    expect(key[2]).toBe('POST')
    expect(key[3]).toBe(JSON.stringify({ mirrorId: 'abc' }))
  })

  it('returns data from SWR', () => {
    const peerDbData = { mirrors: [{ id: '1', name: 'test' }] }

    mockUseSWR.mockReturnValue({
      data: peerDbData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = usePeerDB('/mirrors/list')
    expect(result.data).toEqual(peerDbData)
  })

  it('returns loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = usePeerDB('/mirrors/list')
    expect(result.isLoading).toBe(true)
  })

  it('returns error from SWR', () => {
    const error = new Error('PeerDB not configured')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mock(() => Promise.resolve()),
    })

    const result = usePeerDB('/mirrors/list')
    expect(result.error).toBe(error)
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

    const result = usePeerDB('/mirrors/list')
    expect(result.refresh).toBe(mockMutate)
  })

  it('returns isValidating from SWR', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
      isValidating: true,
      mutate: mock(() => Promise.resolve()),
    })

    const result = usePeerDB('/mirrors/list')
    expect(result.isValidating).toBe(true)
  })

  it('configures SWR with dedupingInterval', () => {
    usePeerDB('/mirrors/list')

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.dedupingInterval).toBe(3000)
    expect(options.focusThrottleInterval).toBe(5000)
    expect(options.revalidateIfStale).toBe(true)
  })

  it('passes refreshInterval when provided', () => {
    usePeerDB('/mirrors/list', { refreshInterval: 10000 })

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(typeof options.refreshInterval).toBe('function')
  })

  it('merges additional swrConfig', () => {
    usePeerDB('/mirrors/list', {
      swrConfig: { dedupingInterval: 10000 },
    })

    const [, , options] = mockUseSWR.mock.calls[0]
    expect(options.dedupingInterval).toBe(10000)
  })
})
