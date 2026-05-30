/**
 * Tests for browser-proxy-fetcher.ts — Browser connections proxy fetcher.
 *
 * Inlines throwIfNotOk in mock.module('../fetch-error') to avoid
 * contamination from other test files that stub it with a no-op.
 * bun:test mock.module is last-wins per module specifier, but file
 * load order is non-deterministic, so we provide the real implementation.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock apiFetch to return real Response objects
const mockApiFetch = mock(
  async () =>
    new Response(
      JSON.stringify({
        success: true,
        data: [{ col1: 'val1' }],
        metadata: { duration: 50 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
)

mock.module('../api-fetch', () => ({
  apiFetch: mockApiFetch,
}))

// Inline throwIfNotOk so error-path tests work regardless of other files' mocks.
// This must be a proper function, not a no-op, because fetchViaBrowserProxy
// calls throwIfNotOk before reading response.json().
mock.module('../fetch-error', () => ({
  throwIfNotOk: async (
    response: Response,
    fallbackMessage = 'Request failed'
  ): Promise<void> => {
    if (response.ok) return
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; type?: string; details?: unknown }
    }
    const error = new Error(
      errorData.error?.message || `${fallbackMessage}: ${response.statusText}`
    ) as Error & { status?: number; type?: string; details?: unknown }
    error.status = response.status
    if (errorData.error) {
      error.type = errorData.error.type
      error.details = errorData.error.details
    }
    throw error
  },
}))

// Mock BrowserConnection type
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

  beforeEach(() => {
    mockApiFetch.mockClear()

    mockApiFetch.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: [{ col1: 'val1' }],
            metadata: { duration: 50 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    )
  })

  it('sends POST to /api/v1/browser-connections/proxy', async () => {
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
    const { fetchViaBrowserProxy } = await import('../browser-proxy-fetcher')
    const result = await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
    })

    expect(result.data).toEqual([{ col1: 'val1' }])
    expect(result.metadata).toEqual({ duration: 50 })
  })

  it('throws on non-OK response status', async () => {
    mockApiFetch.mockImplementation(
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
    mockApiFetch.mockImplementation(
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
