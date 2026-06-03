/**
 * OAuth discovery metadata for MCP clients (RFC 9728 Protected Resource
 * Metadata). Clerk is the authorization server — it hosts login, consent, and
 * dynamic client registration. We are only the resource server, so all we have
 * to publish is "which authorization server protects this resource"; the MCP
 * client takes it from there (OAuth 2.1 + PKCE against Clerk), then calls
 * /api/mcp with the bearer token we verify in verifyClerkOAuthToken.
 *
 * Hand-rolled (no @clerk/mcp-tools) so the exact same builder runs in the
 * Cloudflare Worker and the in-process Next route, matching the rest of the
 * unified MCP surface.
 */

/**
 * Clerk's authorization-server issuer = its Frontend API origin. The publishable
 * key base64-encodes that host: `pk_live_<base64("clerk.chmonitor.dev$")>`.
 * An explicit CLERK_OAUTH_ISSUER overrides the derivation (e.g. proxied domains).
 */
export function getClerkIssuer(): string | null {
  const explicit = process.env.CLERK_OAUTH_ISSUER
  if (explicit) return explicit.replace(/\/+$/, '')

  const pk =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY
  if (!pk) return null

  const encoded = pk.replace(/^pk_(test|live)_/, '')
  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return null
  }
  const host = decoded.replace(/\$+$/, '')
  return host ? `https://${host}` : null
}

export interface ProtectedResourceMetadata {
  resource: string
  authorization_servers: string[]
  scopes_supported: string[]
  bearer_methods_supported: string[]
}

/** Default OAuth scopes the MCP server requests from Clerk. */
export const MCP_OAUTH_SCOPES = ['email', 'profile'] as const

/** Path MCP clients fetch for resource metadata (RFC 9728). */
export const PROTECTED_RESOURCE_METADATA_PATH =
  '/.well-known/oauth-protected-resource'

/**
 * Build the protected-resource metadata for the given resource origin. Returns
 * null when Clerk is not configured (no issuer derivable) — callers then 404 the
 * metadata route, signalling "this resource is not OAuth-protected".
 */
export function buildProtectedResourceMetadata(
  resource: string,
  scopes: readonly string[] = MCP_OAUTH_SCOPES
): ProtectedResourceMetadata | null {
  const issuer = getClerkIssuer()
  if (!issuer) return null
  return {
    resource: resource.replace(/\/+$/, ''),
    authorization_servers: [issuer],
    scopes_supported: [...scopes],
    bearer_methods_supported: ['header'],
  }
}

/**
 * WWW-Authenticate header value that points an unauthenticated MCP client at the
 * resource metadata, kicking off OAuth discovery (RFC 9728 §5.1).
 */
export function wwwAuthenticateHeader(resourceMetadataUrl: string): string {
  return `Bearer resource_metadata="${resourceMetadataUrl}"`
}
