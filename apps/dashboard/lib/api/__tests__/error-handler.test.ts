/**
 * Tests for error-handler/index.ts
 * Covers withApiHandler and getHostIdFromParams.
 */

import { describe, expect, it } from 'bun:test'
import {
  classifyError,
  getHostIdFromParams,
  withApiHandler,
} from '@/lib/api/error-handler'
import { ApiErrorType } from '@/lib/api/types'

// ─── getHostIdFromParams ─────────────────────────────────────────────

describe('getHostIdFromParams', () => {
  it('returns a number for numeric hostId', () => {
    const params = new URLSearchParams('hostId=3')
    expect(getHostIdFromParams(params)).toBe(3)
  })

  it('returns 0 for hostId=0', () => {
    const params = new URLSearchParams('hostId=0')
    expect(getHostIdFromParams(params)).toBe(0)
  })

  it('returns string for non-numeric hostId', () => {
    const params = new URLSearchParams('hostId=abc')
    expect(getHostIdFromParams(params)).toBe('abc')
  })

  it('throws when hostId is missing', () => {
    const params = new URLSearchParams('')
    expect(() => getHostIdFromParams(params)).toThrow(
      'Missing required parameter: hostId'
    )
  })

  it('throws when hostId is empty string', () => {
    const params = new URLSearchParams('hostId=')
    // URLSearchParams.get('hostId') returns '' for "hostId="
    // but the empty string is falsy, so it throws
    expect(() => getHostIdFromParams(params)).toThrow(
      'Missing required parameter: hostId'
    )
  })

  it('handles large numeric hostId', () => {
    const params = new URLSearchParams('hostId=999')
    expect(getHostIdFromParams(params)).toBe(999)
  })
})

// ─── withApiHandler ──────────────────────────────────────────────────

describe('withApiHandler', () => {
  it('returns the handler response on success', async () => {
    const handler = async () => Response.json({ data: 'success' })
    const wrapped = withApiHandler(handler, {
      route: '/api/v1/test',
      method: 'GET',
    })

    const response = await wrapped(new Request('http://localhost/api/v1/test'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toBe('success')
  })

  it('catches errors and returns classified error response', async () => {
    const handler = async () => {
      throw new Error('Table not found: system.unknown')
    }
    const wrapped = withApiHandler(handler, {
      route: '/api/v1/test',
      method: 'GET',
    })

    const response = await wrapped(new Request('http://localhost/api/v1/test'))
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.type).toBe(ApiErrorType.TableNotFound)
  })

  it('returns 500 for generic QueryError', async () => {
    const handler = async () => {
      throw new Error('Something went wrong')
    }
    const wrapped = withApiHandler(handler)

    const response = await wrapped(new Request('http://localhost/'))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error.type).toBe(ApiErrorType.QueryError)
  })

  it('returns 503 for NetworkError', async () => {
    const handler = async () => {
      throw new Error('ECONNREFUSED connection failed')
    }
    const wrapped = withApiHandler(handler)

    const response = await wrapped(new Request('http://localhost/'))
    expect(response.status).toBe(503)
    const body = await response.json()
    expect(body.error.type).toBe(ApiErrorType.NetworkError)
  })

  it('returns 504 for TimeoutError', async () => {
    const handler = async () => {
      throw new Error('Query timeout exceeded 60s')
    }
    const wrapped = withApiHandler(handler)

    const response = await wrapped(new Request('http://localhost/'))
    expect(response.status).toBe(504)
  })

  it('returns 400 for ValidationError', async () => {
    const handler = async () => {
      throw new Error('Invalid hostId parameter')
    }
    const wrapped = withApiHandler(handler)

    const response = await wrapped(new Request('http://localhost/'))
    expect(response.status).toBe(400)
  })

  it('returns 403 for PermissionError', async () => {
    const handler = async () => {
      throw new Error('Permission denied for user')
    }
    const wrapped = withApiHandler(handler)

    const response = await wrapped(new Request('http://localhost/'))
    expect(response.status).toBe(403)
  })

  it('includes context hostId in error metadata', async () => {
    const handler = async () => {
      throw new Error('fail')
    }
    const wrapped = withApiHandler(handler, { hostId: 5 })

    const response = await wrapped(new Request('http://localhost/'))
    const body = await response.json()
    expect(body.metadata.host).toBe('5')
  })

  it('includes timestamp in error details', async () => {
    const handler = async () => {
      throw new Error('fail')
    }
    const wrapped = withApiHandler(handler)

    const response = await wrapped(new Request('http://localhost/'))
    const body = await response.json()
    expect(body.error.details.timestamp).toBeDefined()
    // Should be a valid ISO date string
    expect(new Date(body.error.details.timestamp).toISOString()).toBe(
      body.error.details.timestamp
    )
  })
})

// ─── classifyError re-export ─────────────────────────────────────────

describe('classifyError re-export', () => {
  it('is re-exported from error-handler index', () => {
    expect(classifyError).toBeDefined()
    expect(typeof classifyError).toBe('function')
    const result = classifyError(new Error('timeout'))
    expect(result.type).toBe(ApiErrorType.TimeoutError)
  })
})
