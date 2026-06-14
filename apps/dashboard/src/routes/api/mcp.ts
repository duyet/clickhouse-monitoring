import { createFileRoute } from '@tanstack/react-router'

import { corsPreflight, handleMcp } from '@chm/mcp-server/http'

/**
 * In-process MCP endpoint — thin re-point of the Next `app/api/mcp/route.ts`.
 *
 * Transport/auth/CORS live in `@chm/mcp-server/http`, shared with the standalone
 * Cloudflare MCP Worker (`apps/mcp`). Each method forwards the Web `Request` to
 * `handleMcp`; OPTIONS answers CORS preflight so cross-origin MCP clients work
 * against the in-process route too (parity with the Worker).
 */
export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      POST: ({ request }) => handleMcp(request),
      GET: ({ request }) => handleMcp(request),
      DELETE: ({ request }) => handleMcp(request),
      OPTIONS: () => corsPreflight(),
    },
  },
})
