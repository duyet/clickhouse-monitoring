/**
 * Runtime-agnostic HTTP glue for the MCP endpoint.
 *
 * Both the Next.js dashboard route (apps/dashboard/app/api/mcp/route.ts) and the
 * standalone Cloudflare Worker (apps/mcp/src/index.ts) wrap the SAME MCP server.
 * Pre-unification each owned its own copy of the auth gate + transport + CORS,
 * and they had already drifted (the Worker added CORS, the route had none). This
 * module is the single source of truth so they cannot drift again.
 *
 * Everything here speaks the Web standard Request/Response, so it runs unchanged
 * in Node (Docker, in-process Next route) and in Workers.
 *
 * Auth is injectable: handleMcp/handleMcpInfo take an `authenticate` function so
 * a caller can layer Clerk OAuth (or anything else) on top of the default
 * API-key check without this Clerk-free package taking a Clerk dependency.
 */

import pkg from '../package.json'
import { apiKeyAuthEnabled, verifyApiKey } from './auth/api-key'
import { getBearerToken } from './auth/bearer-token'
import {
  MCP_TOOLS,
  type McpResource,
  type McpToolCategory,
  type McpToolParam,
} from './data/mcp-tools-data'
import { createMcpServer } from './server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

// Minimal CORS for cross-origin MCP clients (browser-based playgrounds, web MCP
// UIs). `*` is safe because payloads are auth-gated by bearer token, not cookies.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-api-key',
  'Access-Control-Max-Age': '86400',
} as const

export function withCors(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

/** CORS preflight response. Callers should answer OPTIONS with this before auth. */
export function corsPreflight(): Response {
  return withCors(new Response(null, { status: 204 }))
}

/**
 * Workers Route patterns are exact-match; proxies and address-bar normalization
 * can append a trailing slash. Normalize so /api/mcp and /api/mcp/ are identical.
 */
export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '')
  }
  return pathname
}

function unauthorized(): Response {
  return withCors(new Response('Unauthorized', { status: 401 }))
}

/**
 * Resolves a bearer/x-api-key token to a Response (auth failed) or null (allowed).
 * Returning a Response — not throwing — lets callers compose multiple
 * authenticators (try Clerk, then API key) by short-circuiting on the first
 * non-null result.
 */
export type Authenticator = (req: Request) => Promise<Response | null>

/**
 * Default authenticator: HMAC API key.
 *
 * When CHM_API_KEY_SECRET is unset, apiKeyAuthEnabled() is false and this returns
 * null — i.e. NO auth configured means anonymous AI clients are allowed through.
 * This is the "open" case: a self-hosted operator who did not configure auth gets
 * an open MCP endpoint, by their own choice. Deployments that want a closed
 * endpoint set CHM_API_KEY_SECRET (or layer Clerk on top via a custom
 * Authenticator).
 */
export const apiKeyAuthenticator: Authenticator = async (req) => {
  if (!apiKeyAuthEnabled()) return null
  const token =
    getBearerToken(req.headers.get('authorization')) ??
    req.headers.get('x-api-key')
  if (!token) return unauthorized()
  const result = await verifyApiKey(token)
  return result.valid ? null : unauthorized()
}

interface HandleMcpOptions {
  /** Override the auth check. Defaults to the API-key authenticator. */
  authenticate?: Authenticator
}

/**
 * Handle an MCP transport request (POST/GET/DELETE on /api/mcp).
 *
 * Note: unlike the previous per-handler copies, there is no production fail-closed
 * 503 here. "No auth configured" now means "open" (see apiKeyAuthenticator), which
 * is the behavior self-hosted users expect. Close the endpoint by configuring auth.
 */
export async function handleMcp(
  req: Request,
  { authenticate = apiKeyAuthenticator }: HandleMcpOptions = {}
): Promise<Response> {
  try {
    // withCors even on the auth failure: a custom authenticator may return a
    // bare Response, and browser MCP clients need the CORS headers to read it.
    const fail = await authenticate(req)
    if (fail) return withCors(fail)

    const server = createMcpServer()
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    await server.connect(transport)
    const res = await transport.handleRequest(req)
    return withCors(res)
  } catch {
    // Never let an unhandled rejection escape as a CORS-less 500 (the Worker
    // would surface a raw 1101). Keep the error shape consistent across runtimes.
    return withCors(new Response('Internal Server Error', { status: 500 }))
  }
}

/**
 * Server-info wire shape. Intentionally a *subset* of McpTool — the /info
 * endpoint omits each tool's `exampleResponse` to keep the sidebar payload
 * small. This preserves the exact format both handlers returned pre-unification.
 */
interface McpToolSummary {
  name: string
  description: string
  category: McpToolCategory
  params: McpToolParam[]
}

export interface McpServerInfoResponse {
  name: string
  version: string
  description: string
  tools: McpToolSummary[]
  resources: McpResource[]
}

/** Static server-info payload (GET /api/v1/mcp/info). Pure data, no auth. */
export function buildServerInfo(): McpServerInfoResponse {
  return {
    name: 'chmonitor',
    // Live version from the @chm/mcp-server package.json — bundlers (esbuild for
    // the worker, Next for the in-process route, bun for tests) inline the JSON
    // import, so there is no runtime fs read and it stays correct across bumps.
    version: pkg.version,
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
  }
}

/**
 * Handle GET /api/v1/mcp/info with inline auth.
 *
 * Used by the standalone Worker, which has no middleware. The dashboard gates
 * /api/v1/* in middleware.ts instead, so its route uses buildServerInfo()
 * directly — same auth posture, different layer.
 */
export async function handleMcpInfo(
  req: Request,
  { authenticate = apiKeyAuthenticator }: HandleMcpOptions = {}
): Promise<Response> {
  try {
    const fail = await authenticate(req)
    if (fail) return withCors(fail)
    return withCors(Response.json(buildServerInfo()))
  } catch {
    return withCors(new Response('Internal Server Error', { status: 500 }))
  }
}
