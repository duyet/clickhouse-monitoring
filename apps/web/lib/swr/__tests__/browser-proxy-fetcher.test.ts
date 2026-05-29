/**
 * Tests for browser-proxy-fetcher.ts — Browser connections proxy fetcher.
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Mock apiFetch
const mockApiFetch = mock(async () => ({
  ok: true,
  json: async () => ({
    success: true,
    data: [{ col1: 'val1' }],
    metadata: { duration: 50 },
  }),
}))

mock.module('../api-fetch', () => ({
  apiFetch: mockApiFetch,
}))

// Mock throwIfNotOk to be a passthrough for ok responses
const mockThrowIfNotOk = mock(async () => {})

mock.module('../fetch-error', () => ({
  throwIfNotOk: mockThrowIfNotOk,
}))

// Mock BrowserConnection type
mock.module('@/lib/types/browser-connection', () => ({}))

import { fetchViaBrowserProxy } from '../browser-proxy-fetcher'

describe('fetchViaBrowserProxy', () => {
  const mockConnection = {
    id: 'conn-1',
    host: 'https://ch.example.com',
    user: 'default',
    password: 'secret',
  } as any

  beforeEach(() => {
    mockApiFetch.mockClear()
    mockThrowIfNotOk.mockClear()

    mockApiFetch.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ col1: 'val1' }],
        metadata: { duration: 50 },
      }),
    }))
    mockThrowIfNotOk.mockImplementation(async () => {})
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
    const body = JSON.parse(init.body as string)

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
    const body = JSON.parse(init.body as string)
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

  it('throws when throwIfNotOk rejects', async () => {
    const error = new Error('Proxy request failed')
    mockThrowIfNotOk.mockImplementation(async () => {
      throw error
    })

    expect(
      fetchViaBrowserProxy({
        connection: mockConnection,
        query: 'SELECT 1',
      })
    ).rejects.toThrow('Proxy request failed')
  })

  it('passes fallback message to throwIfNotOk', async () => {
    const okResponse = { ok: true }
    mockApiFetch.mockImplementation(async () => okResponse)

    await fetchViaBrowserProxy({
      connection: mockConnection,
      query: 'SELECT 1',
    })

    expect(mockThrowIfNotOk).toHaveBeenCalledWith(
      okResponse,
      'Proxy request failed'
    )
  })

  it('handles queryParams undefined', async () => {
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
