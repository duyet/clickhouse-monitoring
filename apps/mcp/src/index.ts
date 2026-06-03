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
 * Bindings: shares ClickHouse env vars + CHM_API_KEY_SECRET secret, plus the
 * optional CLERK_SECRET_KEY for Clerk OAuth token verification. No KV/D1/R2 —
 * MCP tools only query ClickHouse over HTTP.
 */

import {
  corsPreflight,
  handleMcp,
  handleMcpInfo,
  handleProtectedResourceMetadata,
  normalizePath,
  withCors,
} from '@chm/mcp-server/http'

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const pathname = normalizePath(new URL(request.url).pathname)

      // CORS preflight: respond before auth so browsers can complete the dance.
      if (request.method === 'OPTIONS') return corsPreflight()

      if (pathname === '/api/mcp') return await handleMcp(request)
      if (pathname === '/api/v1/mcp/info') {
        if (request.method !== 'GET') {
          return withCors(new Response('Method Not Allowed', { status: 405 }))
        }
        return await handleMcpInfo(request)
      }
      // OAuth discovery (RFC 9728). In production dash.chmonitor.dev/.well-known/*
      // is served by the dashboard worker; this keeps the MCP worker
      // self-contained when deployed on its own domain.
      if (pathname === '/.well-known/oauth-protected-resource') {
        if (request.method !== 'GET') {
          return withCors(new Response('Method Not Allowed', { status: 405 }))
        }
        return handleProtectedResourceMetadata(request)
      }

      return withCors(new Response('Not Found', { status: 404 }))
    } catch {
      // handleMcp/handleMcpInfo already catch internally; this guards the router
      // itself (URL parsing) so the Worker never returns a CORS-less 1101.
      return withCors(new Response('Internal Server Error', { status: 500 }))
    }
  },
}
