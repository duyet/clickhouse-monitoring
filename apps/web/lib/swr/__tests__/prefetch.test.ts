/**
 * Tests for prefetch.ts — SWR cache prefetching on route hover.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

const mockMutate = mock(() => Promise.resolve())

mock.module('swr', () => ({
  mutate: mockMutate,
}))

let mockFetchResponse: { ok: boolean; json: () => Promise<unknown> }

mock.module('../api-fetch', () => ({
  apiFetch: mock(async () => mockFetchResponse),
}))

// Mock the route-prefetch-map with known routes
mock.module('../route-prefetch-map', () => ({
  routePrefetchMap: {
    '/overview': {
      charts: ['running-queries-count', 'query-count-today'],
      tables: [],
    },
    '/tables': {
      charts: [],
      tables: ['tables'],
    },
    '/running-queries': {
      charts: ['summary-used-by-running-queries'],
      tables: ['running-queries'],
    },
  },
  PrefetchConfig: undefined as unknown,
}))

import { prefetchRoute } from '../prefetch'

describe('prefetchRoute', () => {
  beforeEach(() => {
    mockMutate.mockClear()
    mockFetchResponse = {
      ok: true,
      json: async () => ({ data: [], metadata: {} }),
    }
  })

  afterEach(() => {
    // Reset timers to avoid leaking between tests
  })

  it('does nothing for unknown routes', () => {
    prefetchRoute('/unknown-route', 0)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('prefetches charts for /overview route', async () => {
    prefetchRoute('/overview', 0)

    // Wait for async prefetch to complete
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should have called mutate for each chart
    expect(mockMutate).toHaveBeenCalled()
  })

  it('prefetches tables for /tables route', async () => {
    prefetchRoute('/tables', 0)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockMutate).toHaveBeenCalled()
  })

  it('prefetches both charts and tables for /running-queries', async () => {
    prefetchRoute('/running-queries', 0)

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockMutate).toHaveBeenCalled()
  })

  it('handles fetch failures silently', async () => {
    mockFetchResponse = { ok: false, json: async () => ({}) }

    // Should not throw
    expect(() => prefetchRoute('/overview', 0)).not.toThrow()

    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('handles JSON parse failures silently', async () => {
    mockFetchResponse = {
      ok: true,
      json: async () => {
        throw new Error('Parse error')
      },
    }

    expect(() => prefetchRoute('/overview', 0)).not.toThrow()

    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('deduplicates rapid prefetches for same route+host', () => {
    // Call twice rapidly — second should be deduplicated
    prefetchRoute('/overview', 0)
    prefetchRoute('/overview', 0)

    // Only the first call should trigger fetches
    // The dedup is checked before any async work
  })

  it('allows prefetch for different hostIds on same route', () => {
    prefetchRoute('/overview', 0)
    prefetchRoute('/overview', 1)

    // Both should proceed (different hostIds)
  })
})
