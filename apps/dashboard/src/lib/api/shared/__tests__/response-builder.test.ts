import {
  CacheControl,
  createCachedResponse,
  createErrorResponse,
  createPlainResponse,
  createSuccessResponse,
} from '../response-builder'
import { describe, expect, test } from 'bun:test'
import { ApiErrorType } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function json(res: Response): Promise<any> {
  return res.json()
}

// ---------------------------------------------------------------------------
// CacheControl constants
// ---------------------------------------------------------------------------

describe('CacheControl', () => {
  test('NONE is private with max-age=0', () => {
    expect(CacheControl.NONE).toBe('private, max-age=0')
  })

  test('SHORT has s-maxage=30', () => {
    expect(CacheControl.SHORT).toContain('s-maxage=30')
  })

  test('MEDIUM has s-maxage=60', () => {
    expect(CacheControl.MEDIUM).toContain('s-maxage=60')
  })

  test('LONG has s-maxage=300', () => {
    expect(CacheControl.LONG).toContain('s-maxage=300')
  })
})

// ---------------------------------------------------------------------------
// createSuccessResponse
// ---------------------------------------------------------------------------

describe('createSuccessResponse', () => {
  test('returns success:true with data', async () => {
    const res = createSuccessResponse({ rows: [1, 2, 3] })
    const body = await json(res)
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ rows: [1, 2, 3] })
  })

  test('defaults to HTTP 200', () => {
    const res = createSuccessResponse(null)
    expect(res.status).toBe(200)
  })

  test('uses custom status code', () => {
    const res = createSuccessResponse({ created: true }, undefined, 201)
    expect(res.status).toBe(201)
  })

  test('metadata defaults are empty/zero when no meta provided', async () => {
    const res = createSuccessResponse([])
    const body = await json(res)
    const { metadata } = body
    expect(metadata.queryId).toBe('')
    expect(metadata.duration).toBe(0)
    expect(metadata.rows).toBe(0)
    expect(metadata.host).toBe('')
  })

  test('maps meta fields into metadata', async () => {
    const res = createSuccessResponse([], {
      queryId: 'qid-1',
      duration: 42,
      rows: 7,
      sql: 'SELECT 1',
      apiUrl: '/api/v1/test',
      timezone: 'UTC',
      cachedAt: 1000,
      apiParams: { limit: 10 },
    })
    const { metadata } = await json(res)
    expect(metadata.queryId).toBe('qid-1')
    expect(metadata.duration).toBe(42)
    expect(metadata.rows).toBe(7)
    expect(metadata.sql).toBe('SELECT 1')
    expect(metadata.apiUrl).toBe('/api/v1/test')
    expect(metadata.timezone).toBe('UTC')
    expect(metadata.cachedAt).toBe(1000)
    expect(metadata.apiParams).toEqual({ limit: 10 })
  })

  test('omits optional metadata fields when not provided', async () => {
    const res = createSuccessResponse([])
    const { metadata } = await json(res)
    expect(metadata.cachedAt).toBeUndefined()
    expect(metadata.sql).toBeUndefined()
    expect(metadata.apiUrl).toBeUndefined()
    expect(metadata.apiParams).toBeUndefined()
    expect(metadata.timezone).toBeUndefined()
  })

  test('coerces numeric meta to numbers', async () => {
    const res = createSuccessResponse([], {
      duration: '15' as unknown as number,
      rows: '3' as unknown as number,
    })
    const { metadata } = await json(res)
    expect(typeof metadata.duration).toBe('number')
    expect(typeof metadata.rows).toBe('number')
  })

  test('adds Cache-Control header for 2xx status', () => {
    const res = createSuccessResponse({})
    expect(res.headers.get('Cache-Control')).toBe(CacheControl.SHORT)
  })

  test('adds Cache-Control header for 201', () => {
    const res = createSuccessResponse({}, undefined, 201)
    expect(res.headers.get('Cache-Control')).toBe(CacheControl.SHORT)
  })

  test('does not add Cache-Control for 3xx', () => {
    const res = createSuccessResponse({}, undefined, 301)
    // Cache-Control may be absent or null for non-2xx
    const cc = res.headers.get('Cache-Control')
    expect(cc).toBeNull()
  })

  test('content-type is application/json', () => {
    const res = createSuccessResponse({})
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  test('custom headers are forwarded', () => {
    const res = createSuccessResponse({}, undefined, 200, { 'X-Custom': 'hi' })
    expect(res.headers.get('X-Custom')).toBe('hi')
  })

  test('accepts null data', async () => {
    const res = createSuccessResponse(null)
    const body = await json(res)
    expect(body.data).toBeNull()
    expect(body.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createErrorResponse
// ---------------------------------------------------------------------------

describe('createErrorResponse', () => {
  test('returns success:false', async () => {
    const res = createErrorResponse(
      { type: ApiErrorType.ValidationError, message: 'bad input' },
      400
    )
    const body = await json(res)
    expect(body.success).toBe(false)
  })

  test('sets the correct HTTP status', () => {
    const res = createErrorResponse(
      { type: ApiErrorType.TableNotFound, message: 'not found' },
      404
    )
    expect(res.status).toBe(404)
  })

  test('includes error type and message', async () => {
    const res = createErrorResponse(
      { type: ApiErrorType.QueryError, message: 'query failed' },
      500
    )
    const body = await json(res)
    expect(body.error.type).toBe(ApiErrorType.QueryError)
    expect(body.error.message).toBe('query failed')
  })

  test('propagates details when provided', async () => {
    const res = createErrorResponse(
      {
        type: ApiErrorType.TableNotFound,
        message: 'Table not found',
        details: { table: 'system.x', count: 0 },
      },
      404
    )
    const body = await json(res)
    expect(body.error.details).toEqual({ table: 'system.x', count: 0 })
  })

  test('metadata.host is populated from context.hostId', async () => {
    const res = createErrorResponse(
      { type: ApiErrorType.ValidationError, message: 'err' },
      400,
      { hostId: 2 }
    )
    const body = await json(res)
    expect(body.metadata.host).toBe('2')
  })

  test('metadata.host defaults to unknown when no context', async () => {
    const res = createErrorResponse(
      { type: ApiErrorType.NetworkError, message: 'unreachable' },
      503
    )
    const body = await json(res)
    expect(body.metadata.host).toBe('unknown')
  })

  test('metadata defaults are empty/zero for error shape', async () => {
    const res = createErrorResponse(
      { type: ApiErrorType.ValidationError, message: 'x' },
      400
    )
    const body = await json(res)
    expect(body.metadata.queryId).toBe('')
    expect(body.metadata.duration).toBe(0)
    expect(body.metadata.rows).toBe(0)
  })

  test('content-type is application/json', () => {
    const res = createErrorResponse(
      { type: ApiErrorType.ValidationError, message: 'x' },
      400
    )
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  test('context route and method fields are accepted without error', () => {
    // context.route and context.method are accepted but not stored in the response body
    expect(() =>
      createErrorResponse(
        { type: ApiErrorType.ValidationError, message: 'x' },
        400,
        { route: '/api/v1/test', method: 'GET', hostId: '0' }
      )
    ).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// createCachedResponse
// ---------------------------------------------------------------------------

describe('createCachedResponse', () => {
  // The caller-supplied cache strategy must win over the SHORT default —
  // that is the entire purpose of createCachedResponse. (Previously a trailing
  // Object.assign of DEFAULT_CACHE_HEADERS clobbered it; fixed by spreading
  // defaults BEFORE caller headers in createSuccessResponse.)
  test('applies the requested preset (LONG), not the SHORT default', () => {
    const res = createCachedResponse({ ok: true }, CacheControl.LONG)
    expect(res.headers.get('Cache-Control')).toBe(CacheControl.LONG)
  })

  test('applies a custom cache-control string verbatim', () => {
    const res = createCachedResponse([], 'no-store, no-cache, must-revalidate')
    expect(res.headers.get('Cache-Control')).toBe(
      'no-store, no-cache, must-revalidate'
    )
  })

  test('wraps data in success ApiResponse shape', async () => {
    const res = createCachedResponse([1, 2], CacheControl.SHORT)
    const body = await json(res)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([1, 2])
  })

  test('forwards meta into metadata', async () => {
    const res = createCachedResponse([], CacheControl.MEDIUM, {
      rows: 5,
      sql: 'SELECT 2',
    })
    const { metadata } = await json(res)
    expect(metadata.rows).toBe(5)
    expect(metadata.sql).toBe('SELECT 2')
  })

  test('always returns HTTP 200', () => {
    const res = createCachedResponse({}, CacheControl.NONE)
    expect(res.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// createPlainResponse
// ---------------------------------------------------------------------------

describe('createPlainResponse', () => {
  test('returns raw data without ApiResponse wrapper', async () => {
    const res = createPlainResponse({ hosts: ['0', '1'] })
    const body = await json(res)
    // There should be no 'success' or 'metadata' wrapping
    expect(body.hosts).toEqual(['0', '1'])
    expect(body.success).toBeUndefined()
    expect(body.metadata).toBeUndefined()
  })

  test('defaults to HTTP 200', () => {
    const res = createPlainResponse({})
    expect(res.status).toBe(200)
  })

  test('respects custom status', () => {
    const res = createPlainResponse({ error: 'not found' }, 404)
    expect(res.status).toBe(404)
  })

  test('content-type is application/json', () => {
    const res = createPlainResponse({})
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  test('handles array data', async () => {
    const res = createPlainResponse([1, 2, 3])
    const body = await json(res)
    expect(body).toEqual([1, 2, 3])
  })

  test('handles null data', async () => {
    const res = createPlainResponse(null)
    const body = await json(res)
    expect(body).toBeNull()
  })
})
