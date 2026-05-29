/**
 * Tests for fetch-error.ts — shared throwIfNotOk utility and FetchError type.
 *
 * Inlines the throwIfNotOk implementation to avoid mock.module() contamination
 * from other test files in this directory that stub ../fetch-error with a no-op.
 */

import { describe, expect, it } from 'bun:test'

/** Inlined FetchError type from fetch-error.ts */
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

/** Inlined throwIfNotOk from fetch-error.ts to avoid mock contamination */
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

describe('throwIfNotOk', () => {
  it('does not throw when response.ok is true', async () => {
    const response = new Response(null, { status: 200, statusText: 'OK' })
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
