/**
 * OAuth Protected Resource Metadata (RFC 9728)
 *
 * GET /.well-known/oauth-protected-resource
 *
 * Advertises Clerk as the authorization server for the MCP endpoint so MCP
 * clients (Claude.ai, Cursor, …) can run the OAuth 2.1 login + consent flow
 * against Clerk, then call /api/mcp with the resulting bearer token.
 *
 * Public by design (discovery happens before the client has a token).
 * middleware.ts already lets /.well-known/* through.
 *
 * Imports the SDK-free helpers (@chm/mcp-server/auth + /cors) — NOT
 * @chm/mcp-server/http — so serving metadata does not pull createMcpServer +
 * @modelcontextprotocol/sdk into the dashboard worker bundle (which would undo
 * the separate MCP-worker split). Returns 404 when Clerk OAuth is not
 * discoverable.
 */

import { handleProtectedResourceMetadata } from '@chm/mcp-server/auth'
import { corsPreflight } from '@chm/mcp-server/cors'

export const dynamic = 'force-dynamic'

export function GET(req: Request): Response {
  return handleProtectedResourceMetadata(req)
}

export function OPTIONS(): Response {
  return corsPreflight()
}
