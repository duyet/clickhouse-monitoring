import { createFileRoute } from '@tanstack/react-router'

import { buildServerInfo, withCors } from '@chm/mcp-server/http'

/**
 * MCP server info — GET /api/v1/mcp/info.
 *
 * Returns the MCP server's tools/resources for the agents sidebar. The payload
 * is shared with the standalone Worker via `buildServerInfo()` so the two
 * deployments never drift. Auth for `/api/v1/*` is handled by the request
 * middleware (Phase 5) when `apiKeyAuthEnabled()`.
 */
export const Route = createFileRoute('/api/v1/mcp/info')({
  server: {
    handlers: {
      GET: () => withCors(Response.json(buildServerInfo())),
    },
  },
})
