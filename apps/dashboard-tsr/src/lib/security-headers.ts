/**
 * Security response headers applied to every response.
 *
 * Covers MIME-sniffing protection, clickjacking prevention, referrer
 * information leakage, and feature gating. CSP is intentionally omitted —
 * the app loads remote scripts (Clerk, analytics) and constructing a strict
 * CSP would require ongoing maintenance that outweighs the benefit at this
 * stage.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

/**
 * Clone a Response with security headers appended.
 *
 * Preserves status, statusText, body, and all original headers.
 * Security headers overwrite any pre-existing values for the same names
 * (defence-in-depth — e.g. an API route that accidentally sets a permissive
 * X-Frame-Options gets corrected).
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
