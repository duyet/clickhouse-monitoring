// @ts-nocheck — test helper, only runs under bun:test
/**
 * Shared mock setup for SWR hook tests.
 *
 * PROBLEM: bun:test's mock.module() is process-global. When multiple test
 * files mock '../api-fetch' with different implementations, the last one
 * to load wins, breaking all others (especially browser-proxy-fetcher).
 *
 * SOLUTION: This file registers mock.module() ONCE with shared mock functions.
 * Each test file imports these functions and uses mockImplementation() per-test.
 *
 * USAGE:
 *   import { mockApiFetch } from './shared-mocks'
 *   // In each test:
 *   mockApiFetch.mockImplementation(async (url) => { ... })
 */
import { mock } from 'bun:test'

// Shared mock functions — tests customize via mockImplementation()
export const mockApiFetch = mock(
  async () =>
    new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
)

mock.module('../api-fetch', () => ({
  apiFetch: mockApiFetch,
}))

// Inline the real throwIfNotOk to prevent other files' no-op stubs from
// breaking error-path tests
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
