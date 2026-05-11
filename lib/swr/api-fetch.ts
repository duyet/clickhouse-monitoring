'use client'

/**
 * Fetch wrapper for first-party dashboard API calls.
 *
 * Authentication headers must be supplied by trusted runtime context
 * (for example, server-to-server requests), not embedded in browser bundles.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return init === undefined ? fetch(input) : fetch(input, init)
}
