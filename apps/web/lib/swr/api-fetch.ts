'use client'

/**
 * Fetch wrapper for first-party dashboard API calls.
 *
 * Authentication headers must be supplied by trusted runtime context
 * (for example, server-to-server requests), not embedded in browser bundles.
 *
 * For agent/streaming endpoints, also intercepts non-stream HTML error
 * responses (e.g. Cloudflare's 1027 "Worker exceeded resource limits" page)
 * so they surface through the AI SDK error path rather than being rendered
 * as message content.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response =
    init === undefined ? await fetch(input) : await fetch(input, init)

  const contentType = response.headers?.get?.('content-type') ?? ''
  const isStream =
    contentType.includes('text/event-stream') ||
    contentType.includes('application/json') ||
    contentType.includes('application/x-ndjson')

  if (response.ok && isStream) return response

  if (!response.ok && !isStream && contentType.includes('text/html')) {
    const bodyText = await response.clone().text()
    const truncated = bodyText.slice(0, 500)
    const isCfResourceLimit = /Worker exceeded resource limits/i.test(bodyText)
    const message = isCfResourceLimit
      ? 'Cloudflare Worker exceeded resource limits (CPU/memory). Try a smaller question, disable some tools, or use a faster model.'
      : `Request failed (${response.status} ${response.statusText || 'Error'})`
    const err = new Error(message)
    ;(err as { details?: string }).details = truncated
    throw err
  }

  return response
}
