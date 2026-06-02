/**
 * Tests for response-builder
 * Covers createSuccessResponse, createErrorResponse, createCachedResponse, createPlainResponse, CacheControl.
 */

import type { SuccessResponseMeta } from '@/lib/api/shared/response-builder'

import { describe, expect, it } from 'bun:test'
import {
  CacheControl,
  createCachedResponse,
  createErrorResponse,
  createPlainResponse,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'

// ─── CacheControl presets ───────────────────────────────────────────

describe('CacheControl', () => {
  it('has NONE preset with private, max-age=0', () => {
    expect(CacheControl.NONE).toBe('private, max-age=0')
  })

  it('has SHORT preset with s-maxage=30', () => {
    expect(CacheControl.SHORT).toContain('s-maxage=30')
  })

  it('has MEDIUM preset with s-maxage=60', () => {
    expect(CacheControl.MEDIUM).toContain('s-maxage=60')
  })

  it('has LONG preset with s-maxage=300', () => {
    expect(CacheControl.LONG).toContain('s-maxage=300')
  })
})

// ─── createSuccessResponse ──────────────────────────────────────────

describe('createSuccessResponse', () => {
  it('creates a 200 response with success=true and data', async () => {
    const response = createSuccessResponse({ items: [1, 2, 3] })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ items: [1, 2, 3] })
    expect(body.metadata).toBeDefined()
    expect(body.metadata.queryId).toBe('')
    expect(body.metadata.duration).toBe(0)
    expect(body.metadata.rows).toBe(0)
    expect(body.metadata.host).toBe('')
  })

  it('includes metadata when provided', async () => {
    const meta: SuccessResponseMeta = {
      queryId: 'q-123',
      duration: 42,
      rows: 10,
      sql: 'SELECT 1',
      cachedAt: 1700000000,
      apiUrl: 'http://localhost/api',
      apiParams: { hostId: 0 },
      timezone: 'UTC',
    }
    const response = createSuccessResponse({ result: true }, meta)
    const body = await response.json()

    expect(body.metadata.queryId).toBe('q-123')
    expect(body.metadata.duration).toBe(42)
    expect(body.metadata.rows).toBe(10)
    expect(body.metadata.sql).toBe('SELECT 1')
    expect(body.metadata.cachedAt).toBe(1700000000)
    expect(body.metadata.apiUrl).toBe('http://localhost/api')
    expect(body.metadata.apiParams).toEqual({ hostId: 0 })
    expect(body.metadata.timezone).toBe('UTC')
  })

  it('omits optional metadata fields when not provided', async () => {
    const response = createSuccessResponse({ ok: true })
    const body = await response.json()
    expect(body.metadata.cachedAt).toBeUndefined()
    expect(body.metadata.sql).toBeUndefined()
    expect(body.metadata.apiUrl).toBeUndefined()
  })

  it('sets Content-Type to application/json', () => {
    const response = createSuccessResponse({})
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('adds default cache headers for 2xx responses', () => {
    const response = createSuccessResponse({})
    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toBe(CacheControl.SHORT)
  })

  it('does not add default cache headers for non-2xx responses', () => {
    const response = createSuccessResponse({}, undefined, 301)
    const cacheControl = response.headers.get('Cache-Control')
    // No cache headers for redirects
    expect(cacheControl).toBeNull()
  })

  it('accepts custom status code', async () => {
    const response = createSuccessResponse({ created: true }, undefined, 201)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('merges custom headers', () => {
    const response = createSuccessResponse({}, undefined, 200, {
      'X-Custom': 'test-value',
    })
    expect(response.headers.get('X-Custom')).toBe('test-value')
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('coerces metadata values to correct types', async () => {
    const meta = {
      queryId: 123 as unknown as string,
      duration: '42' as unknown as number,
      rows: '10' as unknown as number,
    }
    const response = createSuccessResponse({}, meta)
    const body = await response.json()
    expect(body.metadata.queryId).toBe('123')
    expect(body.metadata.duration).toBe(42)
    expect(body.metadata.rows).toBe(10)
  })
})

// ─── createErrorResponse ────────────────────────────────────────────

describe('createErrorResponse', () => {
  it('creates an error response with correct structure', async () => {
    const response = createErrorResponse(
      {
        type: ApiErrorType.ValidationError,
        message: 'Invalid parameter',
      },
      400
    )
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.type).toBe(ApiErrorType.ValidationError)
    expect(body.error.message).toBe('Invalid parameter')
  })

  it('includes error details when provided', async () => {
    const response = createErrorResponse(
      {
        type: ApiErrorType.TableNotFound,
        message: 'Table missing',
        details: { table: 'system.unknown', availableTables: 'a, b' },
      },
      404
    )
    const body = await response.json()
    expect(body.error.details.table).toBe('system.unknown')
    expect(body.error.details.availableTables).toBe('a, b')
  })

  it('includes context hostId in metadata', async () => {
    const response = createErrorResponse(
      { type: ApiErrorType.QueryError, message: 'fail' },
      500,
      { hostId: 3, route: '/api/v1/data', method: 'GET' }
    )
    const body = await response.json()
    expect(body.metadata.host).toBe('3')
  })

  it('uses "unknown" as host when no context provided', async () => {
    const response = createErrorResponse(
      { type: ApiErrorType.QueryError, message: 'fail' },
      500
    )
    const body = await response.json()
    expect(body.metadata.host).toBe('unknown')
  })

  it('sets Content-Type to application/json', () => {
    const response = createErrorResponse(
      { type: ApiErrorType.QueryError, message: 'fail' },
      500
    )
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})

// ─── createCachedResponse ───────────────────────────────────────────

describe('createCachedResponse', () => {
  it('creates response with default cache-control header (custom is overridden by DEFAULT_CACHE_HEADERS)', async () => {
    const response = createCachedResponse(
      { data: [1, 2] },
      'no-store, no-cache'
    )
    expect(response.status).toBe(200)
    // createCachedResponse passes custom cache-control as headers to createSuccessResponse,
    // but createSuccessResponse applies DEFAULT_CACHE_HEADERS via Object.assign after,
    // so the default SHORT preset wins over the custom value.
    expect(response.headers.get('Cache-Control')).toBe(CacheControl.SHORT)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ data: [1, 2] })
  })

  it('passes metadata through to createSuccessResponse', async () => {
    const response = createCachedResponse({ ok: true }, CacheControl.LONG, {
      rows: 5,
      sql: 'SELECT 1',
    })
    const body = await response.json()
    expect(body.metadata.rows).toBe(5)
    expect(body.metadata.sql).toBe('SELECT 1')
  })
})

// ─── createPlainResponse ────────────────────────────────────────────

describe('createPlainResponse', () => {
  it('creates a plain JSON response without API wrapper', async () => {
    const response = createPlainResponse({ hosts: ['a', 'b'] })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const body = await response.json()
    // No success/metadata wrapper — just the raw data
    expect(body).toEqual({ hosts: ['a', 'b'] })
    expect(body.success).toBeUndefined()
    expect(body.metadata).toBeUndefined()
  })

  it('accepts custom status code', () => {
    const response = createPlainResponse({ error: 'not found' }, 404)
    expect(response.status).toBe(404)
  })

  it('works with array data', async () => {
    const response = createPlainResponse([1, 2, 3])
    const body = await response.json()
    expect(body).toEqual([1, 2, 3])
  })
})
