/**
 * Tests for browser-proxy-fetcher.ts — Browser connections proxy fetcher.
 *
 * Uses shared-mocks.ts for ../api-fetch and ../fetch-error to avoid
 * cross-file mock.module() contamination. Per-test mockImplementation
 * instead of beforeEach to prevent global hook accumulation.
 */

import { mockApiFetch } from './shared-mocks'
// Mock BrowserConnection type
import { describe, expect, it, mock } from 'bun:test'

mock.module('@/lib/types/browser-connection', () => ({
  BROWSER_CONNECTIONS_STORAGE_KEY: 'clickhouse-monitor-browser-connections',
}))

describe('fetchViaBrowserProxy', () => {
  const mockConnection = {
    id: 'conn-1',
    host: 'https://ch.example.com',
    user: 'default',
    password: 'secret',
  } as any

  function setupMock(impl?: () => Promise<Response>) {
    // Shared mock persists across tests in this file, so wipe recorded calls
    // first — otherwise mock.calls[0] returns an earlier test's call.
    mockApiFetch.mockClear()
    mockApiFetch.mockImplementation(
      impl ??
        (async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: [{ col1: 'val1' }],
              metadata: { duration: 50 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          ))
    )
  }

  it('sends POST to /api/v1/browser-connections/proxy', async () => {
    setupMock()
    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
    })

    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/browser-connections/proxy',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('sends connection credentials and query in body', async () => {
    setupMock()
    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT * FROM system.tables',
      queryParams: { database: 'default' },
    })

    const [, init] = mockApiFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)

    expect(body.connection.host).toBe('https://ch.example.com')
    expect(body.connection.user).toBe('default')
    expect(body.connection.password).toBe('secret')
    expect(body.query).toBe('SELECT * FROM system.tables')
    expect(body.query_params).toEqual({ database: 'default' })
    expect(body.format).toBe('JSONEachRow') // default format
  })

  it('uses custom format when provided', async () => {
    setupMock()
    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
      format: 'JSON',
    })

    const [, init] = mockApiFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body.format).toBe('JSON')
  })

  it('returns data and metadata from response', async () => {
    setupMock()
    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    const result = await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
    })

    expect(result.data).toEqual([{ col1: 'val1' }])
    expect(result.metadata).toEqual({ duration: 50 })
  })

  it('throws on non-OK response status', async () => {
    setupMock(
      async () =>
        new Response(
          JSON.stringify({ error: { message: 'Proxy request failed' } }),
          { status: 502, statusText: 'Bad Gateway' }
        )
    )

    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    await expect(
      fetchViaBrowserProxy({
        connection: mockConnection,
        query: 'SELECT 1',
      })
    ).rejects.toThrow('Proxy request failed')
  })

  it('uses fallback message when error body has no message', async () => {
    setupMock(
      async () =>
        new Response(JSON.stringify({}), {
          status: 500,
          statusText: 'Internal Server Error',
        })
    )

    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    await expect(
      fetchViaBrowserProxy({
        connection: mockConnection,
        query: 'SELECT 1',
      })
    ).rejects.toThrow('Proxy request failed')
  })

  it('handles queryParams undefined', async () => {
    setupMock()
    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
      queryParams: undefined,
    })

    const [, init] = mockApiFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body.query_params).toBeUndefined()
  })
})
