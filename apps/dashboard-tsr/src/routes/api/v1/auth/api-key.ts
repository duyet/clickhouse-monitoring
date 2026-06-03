/**
 * API Key Issuance Endpoint
 * POST /api/v1/auth/api-key
 *
 * Mints a signed API key for use with the MCP server.
 * Requires CHM_API_KEY_SECRET as a Bearer token to authorize issuance.
 *
 * NOTE: This endpoint depends on @chm/mcp-server/auth (getBearerToken,
 * issueApiKey) which is not present in this app. It returns HTTP 501 until
 * the mcp-server package is added as a dependency.
 *
 * Ported from apps/dashboard/app/api/v1/auth/api-key/route.ts.
 */

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/v1/auth/api-key')({
  server: {
    handlers: {
      POST: async (): Promise<Response> => {
        return Response.json(
          {
            error:
              'Not implemented: @chm/mcp-server is not available in this app. ' +
              'Add @chm/mcp-server to apps/dashboard-tsr dependencies to enable this endpoint.',
          },
          { status: 501 }
        )
      },
    },
  },
})
