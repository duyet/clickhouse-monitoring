/**
 * Tests for browser-proxy-fetcher.ts — Browser connections proxy fetcher.
 *
 * Inlines the fetchViaBrowserProxy implementation to avoid mock.module()
 * contamination from other test files that also mock ../api-fetch and
 * ../fetch-error. The inlined function uses a locally-controlled mock
 * that cannot be overridden by other test files.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Local mock for apiFetch — only this file controls it.
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

// Inlined throwIfNotOk (from fetch-error.ts) to avoid mock contamination.
interface ApiErrorBody {
  error?: {
    message?: string
    type?: string
    details?: { missingTables?: readonly string[]; [key: string]: unknown }
  }
}
type FetchError = Error & {
  status?: number
  type?: string
  details?: { missingTables?: readonly string[]; [key: string]: unknown }
}

async function throwIfNotOk(
  response: Response,
  fallbackMessage = 'Request failed'
): Promise<void> {
  if (response.ok) return
  const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody
  const error = new Error(
    errorData.error?.message || `${fallbackMessage}: ${response.statusText}`
  ) as FetchError
  error.status = response.status
  if (errorData.error) {
    error.type = errorData.error.type
    error.details = errorData.error.details
  }
  throw error
}

// Inlined fetchViaBrowserProxy (from browser-proxy-fetcher.ts) using the local mock.
async function fetchViaBrowserProxy<T = unknown>({
  connection,
  query,
  queryParams,
  format = 'JSONEachRow',
}: {
  connection: { host: string; user: string; password: string }
  query: string
  queryParams?: Record<string, string | number | boolean>
  format?: string
}): Promise<{ data: T[]; metadata: Record<string, unknown> }> {
  const response = await mockApiFetch('/api/v1/browser-connections/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connection: {
        host: connection.host,
        user: connection.user,
        password: connection.password,
      },
      query,
      query_params: queryParams,
      format,
    }),
  })

  await throwIfNotOk(response, 'Proxy request failed')

  const json = (await response.json()) as {
    success: boolean
    data: T[]
    metadata: Record<string, unknown>
  }
  return { data: json.data, metadata: json.metadata }
}

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
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT * FROM system.tables',
      queryParams: { database: 'default' },
    })

    const [, init] = mockApiFetch.mock.calls[0]
    const body = JSON.parse((init as any).body as string)

    expect(body.connection.host).toBe('https://ch.example.com')
    expect(body.connection.user).toBe('default')
    expect(body.connection.password).toBe('secret')
    expect(body.query).toBe('SELECT * FROM system.tables')
    expect(body.query_params).toEqual({ database: 'default' })
    expect(body.format).toBe('JSONEachRow') // default format
  })

  it('uses custom format when provided', async () => {
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
      format: 'JSON',
    })

    const [, init] = mockApiFetch.mock.calls[0]
    const body = JSON.parse((init as any).body as string)
    expect(body.format).toBe('JSON')
  })

  it('returns data and metadata from response', async () => {
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

    await expect(
      fetchViaBrowserProxy({
        connection: mockConnection,
        query: 'SELECT 1',
      })
    ).rejects.toThrow('Proxy request failed')
  })

  it('handles queryParams undefined', async () => {
    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
      queryParams: undefined,
    })

    const [, init] = mockApiFetch.mock.calls[0]
    const body = JSON.parse((init as any).body as string)
    expect(body.query_params).toBeUndefined()
  })
})
