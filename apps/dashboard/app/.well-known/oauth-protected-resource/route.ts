/**
 * OAuth Protected Resource Metadata (RFC 9728)
 *
 * GET /.well-known/oauth-protected-resource
 *
 * Advertises Clerk as the authorization server for the MCP endpoint so MCP
 * clients (Claude.ai, Cursor, …) can run the OAuth 2.1 login + consent flow
 * against Clerk, then call /api/mcp with the resulting bearer token.
 *
 * Public by design (discovery happens before the client has a token) and shared
 * with the standalone Worker via @chm/mcp-server/http. Returns 404 when Clerk
 * OAuth is not configured. middleware.ts already lets /.well-known/* through.
 */

import {
  corsPreflight,
  handleProtectedResourceMetadata,
} from '@chm/mcp-server/http'

export const dynamic = 'force-dynamic'

export function GET(req: Request): Response {
  return handleProtectedResourceMetadata(req)
}

export function OPTIONS(): Response {
  return corsPreflight()
}
