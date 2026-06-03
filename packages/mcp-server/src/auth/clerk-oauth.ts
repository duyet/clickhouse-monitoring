/**
 * Clerk OAuth access-token verification via Clerk's REST introspection endpoint.
 *
 * Deliberately runtime-agnostic — just `fetch` + the Clerk secret key — so the
 * SAME verifier runs in the standalone Cloudflare Worker (which has no
 * @clerk/nextjs) AND the in-process Next.js route. This is what lets Clerk MCP
 * auth work identically across Docker and Cloudflare instead of being an
 * in-process-only feature.
 *
 *   POST https://api.clerk.com/oauth_applications/access_tokens/verify
 *     Authorization: Bearer <CLERK_SECRET_KEY>
 *     { "access_token": "<token>" }
 *
 * Clerk hosts the authorization server (login + consent + dynamic client
 * registration); we are only the resource server that verifies the bearer token
 * the MCP client presents.
 */

const DEFAULT_CLERK_API_URL = 'https://api.clerk.com'

export interface ClerkOAuthResult {
  valid: boolean
  /** Clerk user id the token was issued for (when valid). */
  subject?: string
  /** OAuth scopes granted to the token (when valid). */
  scopes?: string[]
  reason?: string
}

/** True when Clerk OAuth verification is configured (secret key present). */
export function clerkOAuthEnabled(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY)
}

interface VerifyOptions {
  /** Override the secret key (defaults to CLERK_SECRET_KEY). */
  secretKey?: string
  /** Override the Clerk API base (defaults to CLERK_API_URL or api.clerk.com). */
  apiUrl?: string
}

export async function verifyClerkOAuthToken(
  token: string,
  opts: VerifyOptions = {}
): Promise<ClerkOAuthResult> {
  const secretKey = opts.secretKey ?? process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    return { valid: false, reason: 'CLERK_SECRET_KEY not configured' }
  }
  const apiUrl =
    opts.apiUrl ?? process.env.CLERK_API_URL ?? DEFAULT_CLERK_API_URL

  let res: Response
  try {
    res = await fetch(`${apiUrl}/oauth_applications/access_tokens/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: token }),
    })
  } catch {
    return { valid: false, reason: 'clerk verify request failed' }
  }

  if (!res.ok) {
    // 4xx (including 401/404 for unknown/expired tokens) → invalid, not an error.
    return { valid: false, reason: `clerk verify responded ${res.status}` }
  }

  try {
    const data = (await res.json()) as {
      subject?: string
      scopes?: string[]
      // Clerk can return 2xx for a structurally-valid but UNUSABLE token
      // (introspection-style): inactive, revoked, or already expired. Treating
      // every 2xx as valid would authenticate such tokens — an auth bypass.
      active?: boolean
      revoked?: boolean
      expired?: boolean
    }
    if (
      data.active === false ||
      data.revoked === true ||
      data.expired === true
    ) {
      return {
        valid: false,
        reason: 'clerk token inactive, revoked, or expired',
      }
    }
    // A usable token always identifies a subject; its absence means the response
    // does not describe a live token we can attribute, so reject rather than
    // grant anonymous-but-authenticated access.
    if (!data.subject) {
      return { valid: false, reason: 'clerk verify returned no subject' }
    }
    return { valid: true, subject: data.subject, scopes: data.scopes }
  } catch {
    return { valid: false, reason: 'clerk verify returned malformed JSON' }
  }
}
