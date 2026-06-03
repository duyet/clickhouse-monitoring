/**
 * Standalone Cloudflare Worker for the MCP endpoint.
 *
 * Split out of the main Next.js worker because @modelcontextprotocol/sdk +
 * lib/mcp/tools accounted for ~390 KB of the main bundle. Cloudflare Workers
 * Routes deliver dash.chmonitor.dev/api/mcp* + /api/v1/mcp/info* to this
 * worker directly; the dashboard worker never sees those paths in production.
 *
 * All transport/auth/CORS glue lives in @chm/mcp-server/http so this Worker and
 * the in-process Next.js route (apps/dashboard/app/api/mcp/route.ts) share one
 * implementation and cannot drift.
 *
 * Bindings: shares ClickHouse env vars + CHM_API_KEY_SECRET secret. No
 * KV/D1/R2 — MCP tools only query ClickHouse over HTTP.
 */

import {
  corsPreflight,
  handleMcp,
  handleMcpInfo,
  normalizePath,
  withCors,
} from '@chm/mcp-server/http'

export default {
  async fetch(request: Request): Promise<Response> {
    const pathname = normalizePath(new URL(request.url).pathname)

    // CORS preflight: respond before auth so browsers can complete the dance.
    if (request.method === 'OPTIONS') return corsPreflight()

    if (pathname === '/api/mcp') return handleMcp(request)
    if (pathname === '/api/v1/mcp/info') {
      if (request.method !== 'GET') {
        return withCors(new Response('Method Not Allowed', { status: 405 }))
      }
      return handleMcpInfo(request)
    }

    return withCors(new Response('Not Found', { status: 404 }))
  },
}
