import { createFileRoute } from '@tanstack/react-router'

import { corsPreflight, handleMcp } from '@chm/mcp-server/http'
import { requirePlanCapability } from '@/lib/billing/plan-capability'

/**
 * In-process MCP endpoint — thin re-point of the Next `app/api/mcp/route.ts`.
 *
 * Transport/auth/CORS live in `@chm/mcp-server/http`, shared with the standalone
 * Cloudflare MCP Worker (`apps/mcp`). Each method forwards the Web `Request` to
 * `handleMcp`; OPTIONS answers CORS preflight so cross-origin MCP clients work
 * against the in-process route too (parity with the Worker).
 *
 * Plan gate: POST and GET require the `api_mcp_access` capability (Max / Enterprise).
 * Self-hosted deployments are never gated — the capability check short-circuits to
 * null (allow) whenever billing context is unavailable. See lib/billing/plan-capability.ts.
 */
export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requirePlanCapability('api_mcp_access', request)
        if (denied) return denied
        return handleMcp(request)
      },
      GET: async ({ request }) => {
        const denied = await requirePlanCapability('api_mcp_access', request)
        if (denied) return denied
        return handleMcp(request)
      },
      DELETE: ({ request }) => handleMcp(request),
      OPTIONS: () => corsPreflight(),
    },
  },
})
