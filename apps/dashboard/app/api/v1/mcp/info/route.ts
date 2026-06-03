/**
 * MCP Server Info Endpoint
 *
 * GET /api/v1/mcp/info
 *
 * Returns information about the MCP server, its tools, and resources.
 * Used by the agents sidebar to display available tools.
 *
 * Auth: gated by middleware.ts for all /api/v1/* when apiKeyAuthEnabled(). The
 * standalone Worker has no middleware, so it uses handleMcpInfo (inline auth)
 * instead — same posture, different layer. The payload itself is shared via
 * buildServerInfo() so the two deployments never drift.
 */

import { buildServerInfo, withCors } from '@chm/mcp-server/http'

export const dynamic = 'force-dynamic'

export function GET() {
  return withCors(Response.json(buildServerInfo()))
}
