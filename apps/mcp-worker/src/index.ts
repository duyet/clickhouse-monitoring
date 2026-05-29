/**
 * Standalone Cloudflare Worker for the MCP endpoint.
 *
 * Split out of the main Next.js worker because @modelcontextprotocol/sdk +
 * lib/mcp/tools accounted for ~390 KB of the main bundle. Cloudflare Workers
 * Routes deliver chmonitor.dev/api/mcp* + /api/v1/mcp/info* to this worker
 * directly; the main worker never sees those paths in production.
 *
 * Bindings: shares ClickHouse env vars + CHM_API_KEY_SECRET secret. No
 * KV/D1/R2 — MCP tools only query ClickHouse over HTTP.
 */

import { MCP_TOOLS } from '../../web/components/mcp/mcp-tools-data'
import { apiKeyAuthEnabled, verifyApiKey } from '../../web/lib/api-key'
import { getBearerToken } from '../../web/lib/auth/bearer-token'
import { createMcpServer } from '../../web/lib/mcp/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

// Minimal CORS for cross-origin MCP clients (browser-based playgrounds, web
// MCP UIs, etc.). Cloudflare Workers default to no Access-Control-* headers,
// so browsers reject preflights without these. `*` is safe here because the
// payloads are auth-gated by CHM_API_KEY_SECRET — no cookies involved.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-api-key',
  'Access-Control-Max-Age': '86400',
}

function withCors(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

function unauthorized(): Response {
  return withCors(new Response('Unauthorized', { status: 401 }))
}

async function authenticate(req: Request): Promise<Response | null> {
  if (!apiKeyAuthEnabled()) return null
  const authHeader = req.headers.get('authorization')
  const bearerToken = getBearerToken(authHeader)
  const apiKeyHeader = req.headers.get('x-api-key')
  const token = bearerToken ?? apiKeyHeader
  if (!token) return unauthorized()
  const result = await verifyApiKey(token)
  if (!result.valid) return unauthorized()
  return null
}

async function handleMcp(req: Request): Promise<Response> {
  // Mirrors the production posture of app/api/mcp/route.ts: in production
  // auth is required even if the secret happens to be unset — we 503 instead
  // of accepting anonymous traffic ("fail closed").
  const apiKeySecret = process.env.CHM_API_KEY_SECRET
  const authRequired =
    process.env.NODE_ENV === 'production' || Boolean(apiKeySecret)
  if (authRequired && !apiKeySecret) {
    return withCors(
      new Response('MCP API key auth is not configured', { status: 503 })
    )
  }
  if (authRequired) {
    const fail = await authenticate(req)
    if (fail) return fail
  }

  const server = createMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })
  await server.connect(transport)
  const res = await transport.handleRequest(req)
  return withCors(res)
}

async function handleInfo(req: Request): Promise<Response> {
  // Pre-split, /api/v1/mcp/info went through middleware.ts which applied the
  // same apiKeyAuthEnabled() gate as every other /api/v1/* route. Preserve
  // that posture here so the auth surface doesn't silently widen.
  const fail = await authenticate(req)
  if (fail) return fail

  return withCors(
    Response.json({
      name: 'clickhouse-monitor',
      version: '1.0.0',
      description: 'ClickHouse monitoring and query tools',
      tools: MCP_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        category: tool.category,
        params: tool.params,
      })),
      resources: [
        {
          name: 'system-tables',
          uri: 'clickhouse://system-tables',
          description:
            'Reference of key ClickHouse system tables used for monitoring',
        },
        {
          name: 'query-examples',
          uri: 'clickhouse://query-examples',
          description:
            'Example SQL queries for common ClickHouse monitoring tasks',
        },
      ],
    })
  )
}

// Cloudflare Workers Route patterns are exact-match without a `*`, but proxies
// and address-bar normalization can add trailing slashes. Match on a normalized
// path so /api/mcp and /api/mcp/ behave identically.
function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '')
  }
  return pathname
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathname = normalizePath(url.pathname)

    // CORS preflight: respond before auth so browsers can complete the dance.
    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }))
    }

    if (pathname === '/api/mcp') return handleMcp(request)
    if (pathname === '/api/v1/mcp/info') {
      if (request.method !== 'GET') {
        return withCors(new Response('Method Not Allowed', { status: 405 }))
      }
      return handleInfo(request)
    }

    return withCors(new Response('Not Found', { status: 404 }))
  },
}
