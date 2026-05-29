/**
 * Tests for fetch-error.ts — shared throwIfNotOk utility and FetchError type.
 */

import { type FetchError, throwIfNotOk } from '../fetch-error'
import { describe, expect, it } from 'bun:test'

describe('throwIfNotOk', () => {
  it('does not throw when response.ok is true', async () => {
    const response = new Response(null, { status: 200, statusText: 'OK' })
    // Should resolve without throwing
    await expect(throwIfNotOk(response)).resolves.toBeUndefined()
  })

  it('throws with error message from JSON body', async () => {
    const body = JSON.stringify({
      error: { message: 'Something went wrong', type: 'query_error' },
    })
    const response = new Response(body, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'application/json' },
    })

    try {
      await throwIfNotOk(response, 'Default fallback')
      expect.unreachable('Should have thrown')
    } catch (err) {
      const fetchErr = err as FetchError
      expect(fetchErr.message).toBe('Something went wrong')
      expect(fetchErr.status).toBe(500)
      expect(fetchErr.type).toBe('query_error')
    }
  })

  it('throws with fallback message when error body has no message', async () => {
    const body = JSON.stringify({ error: {} })
    const response = new Response(body, {
      status: 502,
      statusText: 'Bad Gateway',
      headers: { 'Content-Type': 'application/json' },
    })

    try {
      await throwIfNotOk(response, 'Custom fallback')
      expect.unreachable('Should have thrown')
    } catch (err) {
      const fetchErr = err as FetchError
      expect(fetchErr.message).toBe('Custom fallback: Bad Gateway')
      expect(fetchErr.status).toBe(502)
    }
  })

  it('throws with fallback message when JSON body is unparseable', async () => {
    const response = new Response('not json', {
      status: 500,
      statusText: 'Server Error',
    })

    try {
      await throwIfNotOk(response, 'Fallback msg')
      expect.unreachable('Should have thrown')
    } catch (err) {
      const fetchErr = err as FetchError
      expect(fetchErr.message).toBe('Fallback msg: Server Error')
      expect(fetchErr.status).toBe(500)
    }
  })

  it('throws with fallback when body is empty object', async () => {
    const response = new Response('{}', {
      status: 404,
      statusText: 'Not Found',
    })

    try {
      await throwIfNotOk(response)
      expect.unreachable('Should have thrown')
    } catch (err) {
      const fetchErr = err as FetchError
      expect(fetchErr.message).toBe('Request failed: Not Found')
      expect(fetchErr.status).toBe(404)
    }
  })

  it('preserves error details (missingTables)', async () => {
    const body = JSON.stringify({
      error: {
        message: 'Missing tables',
        type: 'table_not_found',
        details: { missingTables: ['system.backup_log'] },
      },
    })
    const response = new Response(body, {
      status: 422,
      statusText: 'Unprocessable',
    })

    try {
      await throwIfNotOk(response)
      expect.unreachable('Should have thrown')
    } catch (err) {
      const fetchErr = err as FetchError
      expect(fetchErr.type).toBe('table_not_found')
      expect(fetchErr.details?.missingTables).toEqual(['system.backup_log'])
    }
  })

  it('uses default fallback message when none provided', async () => {
    const body = JSON.stringify({ error: {} })
    const response = new Response(body, {
      status: 503,
      statusText: 'Unavailable',
    })

    try {
      await throwIfNotOk(response)
      expect.unreachable('Should have thrown')
    } catch (err) {
      const fetchErr = err as FetchError
      expect(fetchErr.message).toBe('Request failed: Unavailable')
      expect(fetchErr.status).toBe(503)
    }
  })
})
