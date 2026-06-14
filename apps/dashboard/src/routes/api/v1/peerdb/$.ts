/**
 * PeerDB REST proxy (view-only).
 *
 * Forwards GET/POST requests to the configured PeerDB flow-api, but ONLY for an
 * explicit read-only allowlist. Any path/method not on the list is rejected
 * with 403 so mutating endpoints can never be reached through CHM.
 *
 * The PeerDB Basic-auth credential is attached server-side and never exposed to
 * the browser.
 *
 * Ported from apps/dashboard/app/api/v1/peerdb/[...slug]/route.ts.
 * - Per-route authorizeFeatureRequest dropped (centralized in middleware #1397).
 * - process.env replaced with `env` from cloudflare:workers (Workers runtime).
 * - [...slug] -> $ splat; slug read via params._splat.
 */

import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { generateRequestId } from '@chm/logger'

// ---------------------------------------------------------------------------
// Inlined Workers-safe PeerDB config + fetch (mirrors peerdb-status.ts pattern)
// ---------------------------------------------------------------------------

interface PeerDBConfig {
  baseUrl: string
  password?: string
}

class PeerDBError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'PeerDBError'
  }
}

function getPeerDBConfig(
  bindings: Record<string, string | undefined>
): PeerDBConfig | null {
  const baseUrl = bindings.PEERDB_API_URL?.trim()
  if (!baseUrl) return null
  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    password: bindings.PEERDB_PASSWORD?.trim() || undefined,
  }
}

function authHeader(config: PeerDBConfig): Record<string, string> {
  if (!config.password) return {}
  // PeerDB uses Basic auth with an empty username: base64(':' + password).
  // btoa is available in all Workers runtimes (no Buffer needed).
  const token = btoa(`:${config.password}`)
  return { Authorization: `Basic ${token}` }
}

const FETCH_TIMEOUT_MS = 10_000

async function peerdbFetch(
  config: PeerDBConfig,
  path: string,
  init?: { method: 'GET' | 'POST'; body?: string }
): Promise<unknown> {
  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      method: init?.method ?? 'GET',
      body: init?.body,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(config),
      },
    })
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    throw new PeerDBError(
      aborted
        ? `PeerDB request timed out after ${FETCH_TIMEOUT_MS}ms`
        : `Failed to reach PeerDB: ${
            err instanceof Error ? err.message : 'unknown error'
          }`,
      502
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new PeerDBError(
      `PeerDB API error ${response.status}: ${response.statusText}`,
      response.status
    )
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Allowlist — only these paths may be read-proxied
// ---------------------------------------------------------------------------

const ALLOWLIST: Record<'GET' | 'POST', RegExp[]> = {
  GET: [
    /^\/v1\/version$/,
    /^\/v1\/dynamic_settings$/,
    /^\/v1\/mirrors\/(list|names)$/,
    /^\/v1\/mirrors\/cdc\/table_total_counts\/[^/]+$/,
    /^\/v1\/mirrors\/cdc\/initial_load\/[^/]+$/,
    /^\/v1\/mirrors\/total_rows_synced\/[^/]+$/,
    /^\/v1\/peers\/(list)$/,
    /^\/v1\/peers\/(slots|stats|info|type)\/[^/]+$/,
  ],
  POST: [
    /^\/v1\/mirrors\/status$/,
    /^\/v1\/mirrors\/cdc\/graph$/,
    /^\/v1\/mirrors\/cdc\/batches$/,
    /^\/v1\/mirrors\/logs$/,
    /^\/v1\/peers\/slots\/lag_history$/,
  ],
}

function isAllowed(method: 'GET' | 'POST', path: string): boolean {
  return ALLOWLIST[method].some((re) => re.test(path))
}

/**
 * Build the upstream PeerDB path from the splat.
 *
 * The splat value for `/api/v1/peerdb/mirrors/list` is `mirrors/list`.
 * PeerDB expects `/v1/mirrors/list`, so we prepend `/v1/`.
 */
function buildPath(splat: string): string {
  // splat may have leading slash or not; normalise then prefix.
  const cleaned = splat.replace(/^\/+/, '')
  return `/v1/${cleaned}`
}

// ---------------------------------------------------------------------------
// Error response helpers (inlined from data.ts pattern)
// ---------------------------------------------------------------------------

function errorResponse(message: string, status: number): Response {
  return Response.json({ success: false, error: { message } }, { status })
}

// ---------------------------------------------------------------------------
// Shared handler
// ---------------------------------------------------------------------------

async function handle(
  method: 'GET' | 'POST',
  request: Request,
  splat: string
): Promise<Response> {
  const requestId = generateRequestId()
  const bindings = env as Record<string, string | undefined>
  const config = getPeerDBConfig(bindings)

  if (!config) {
    return Response.json(
      {
        success: false,
        error: { message: 'PeerDB is not configured on this deployment' },
        metadata: { queryId: requestId },
      },
      { status: 503 }
    )
  }

  const path = buildPath(splat)

  if (!isAllowed(method, path)) {
    return errorResponse(
      `Endpoint not allowed (read-only proxy): ${method} ${path}`,
      403
    )
  }

  const url = new URL(request.url)
  const upstreamPath = url.search ? `${path}${url.search}` : path

  try {
    const body = method === 'POST' ? await request.text() : undefined
    const data = await peerdbFetch(config, upstreamPath, {
      method,
      ...(body ? { body } : {}),
    })

    const responseBody = JSON.stringify({
      success: true,
      data,
      metadata: { queryId: requestId, apiUrl: path },
    })

    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=0',
        'X-Request-ID': requestId,
      },
    })
  } catch (err) {
    const status = err instanceof PeerDBError ? err.status : 500
    return Response.json(
      {
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'PeerDB request failed',
        },
        metadata: { queryId: requestId },
      },
      { status }
    )
  }
}

export const Route = createFileRoute('/api/v1/peerdb/$')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        return handle('GET', request, params._splat ?? '')
      },
      POST: async ({ request, params }) => {
        return handle('POST', request, params._splat ?? '')
      },
    },
  },
})
