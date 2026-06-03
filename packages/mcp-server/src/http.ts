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
import { clerkOAuthEnabled, verifyClerkOAuthToken } from './auth/clerk-oauth'
import {
  clerkOAuthDiscoverable,
  PROTECTED_RESOURCE_METADATA_PATH,
  wwwAuthenticateHeader,
} from './auth/oauth-metadata'
import { withCors } from './cors'
import {
  MCP_TOOLS,
  type McpResource,
  type McpToolCategory,
  type McpToolParam,
} from './data/mcp-tools-data'
import { createMcpServer } from './server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

// SDK-free metadata handler, re-exported here for the Worker's single import.
export { handleProtectedResourceMetadata } from './auth/oauth-metadata'
// CORS helpers live in ./cors (SDK-free) so lightweight routes can reuse them
// without pulling the MCP SDK into their bundle. Re-export for the Worker, which
// imports everything from this one module.
export { corsPreflight, withCors } from './cors'

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

/**
 * 401 response. When Clerk OAuth is enabled, attach the RFC 9728
 * WWW-Authenticate header pointing at our resource metadata so MCP clients can
 * discover the authorization server and start the login/consent flow.
 */
function unauthorized(req?: Request): Response {
  const headers = new Headers()
  // Only advertise discovery when it will actually work end to end (verifier +
  // issuer), so we never point a client at a metadata URL that would 404 or at a
  // login flow whose tokens we cannot verify.
  if (req && clerkOAuthDiscoverable()) {
    const metadataUrl = new URL(
      PROTECTED_RESOURCE_METADATA_PATH,
      new URL(req.url).origin
    ).toString()
    headers.set('WWW-Authenticate', wwwAuthenticateHeader(metadataUrl))
  }
  return withCors(new Response('Unauthorized', { status: 401, headers }))
}

/**
 * Tokens split by source. The Authorization bearer is the only credential we are
 * willing to forward to Clerk's REST verifier — a server-issued API key sent via
 * x-api-key must NEVER be relayed to a third party as if it were an OAuth token.
 */
function getRequestTokens(req: Request): {
  bearer: string | null
  apiKey: string | null
} {
  const bearer = getBearerToken(req.headers.get('authorization'))
  return { bearer, apiKey: bearer ?? req.headers.get('x-api-key') }
}

/**
 * Resolves a request to a Response (auth failed) or null (allowed).
 * Returning a Response — not throwing — lets callers compose authenticators by
 * short-circuiting on the first non-null result.
 */
export type Authenticator = (req: Request) => Promise<Response | null>

/**
 * HMAC API-key authenticator.
 *
 * When CHM_API_KEY_SECRET is unset this returns null (allow) — see
 * defaultAuthenticator for the full "open when nothing configured" rationale.
 */
export const apiKeyAuthenticator: Authenticator = async (req) => {
  if (!apiKeyAuthEnabled()) return null
  const { apiKey } = getRequestTokens(req)
  if (!apiKey) return unauthorized(req)
  const result = await verifyApiKey(apiKey)
  return result.valid ? null : unauthorized(req)
}

/**
 * Default MCP authenticator — precedence: (API key | Clerk OAuth) → open.
 *
 * - If NEITHER CHM_API_KEY_SECRET nor CLERK_SECRET_KEY is set, the endpoint is
 *   OPEN: a self-hosted operator who configured no auth gets anonymous access by
 *   their own choice. Close it by configuring either scheme.
 * - If EITHER is configured, a token is required and is accepted when it
 *   validates against ANY configured scheme. This lets API keys (CLI/headless)
 *   and Clerk OAuth (humans via MCP clients) coexist on the same endpoint.
 * - API key is checked first (local HMAC, no network); Clerk is a REST call, so
 *   it runs only if the API-key check did not already accept the credential.
 * - Only the Authorization bearer is forwarded to Clerk. An x-api-key is treated
 *   strictly as an API key and is never relayed to Clerk as an OAuth token.
 *
 * Clerk verification is a plain fetch (see verifyClerkOAuthToken), so this same
 * authenticator works in the Worker and the in-process route — no @clerk/nextjs.
 */
export const defaultAuthenticator: Authenticator = async (req) => {
  const apiKeyOn = apiKeyAuthEnabled()
  const clerkOn = clerkOAuthEnabled()
  if (!apiKeyOn && !clerkOn) return null // open

  const { bearer, apiKey } = getRequestTokens(req)
  if (!bearer && !apiKey) return unauthorized(req)

  if (apiKeyOn && apiKey) {
    const result = await verifyApiKey(apiKey)
    if (result.valid) return null
  }
  if (clerkOn && bearer) {
    const result = await verifyClerkOAuthToken(bearer)
    if (result.valid) return null
  }
  return unauthorized(req)
}

interface HandleMcpOptions {
  /** Override the auth check. Defaults to defaultAuthenticator. */
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
  { authenticate = defaultAuthenticator }: HandleMcpOptions = {}
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
  { authenticate = defaultAuthenticator }: HandleMcpOptions = {}
): Promise<Response> {
  try {
    const fail = await authenticate(req)
    if (fail) return withCors(fail)
    return withCors(Response.json(buildServerInfo()))
  } catch {
    return withCors(new Response('Internal Server Error', { status: 500 }))
  }
}
