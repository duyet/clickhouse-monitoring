'use client'

const dashboardApiKey = process.env.NEXT_PUBLIC_CHM_API_KEY

/**
 * Fetch wrapper for first-party dashboard API calls.
 *
 * When API-key protection is enabled with CHM_API_KEY_SECRET, static dashboard
 * clients can set NEXT_PUBLIC_CHM_API_KEY to a minted key so browser fetches
 * include auth without relying on spoofable request-origin headers.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (!dashboardApiKey) {
    return init === undefined ? fetch(input) : fetch(input, init)
  }

  const headers = new Headers(init?.headers)
  if (!headers.has('authorization') && !headers.has('x-api-key')) {
    headers.set('x-api-key', dashboardApiKey)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
