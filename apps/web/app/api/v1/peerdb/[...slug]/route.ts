/**
 * PeerDB REST proxy (view-only).
 *
 * Forwards GET/POST requests to the configured PeerDB flow-api, but ONLY for an
 * explicit read-only allowlist. Any path/method not on the list is rejected
 * with 403 so mutating endpoints (state_change, create/drop, alerts/config,
 * maintenance) can never be reached through CHM — even if a client crafts one.
 *
 * The PeerDB Basic-auth credential is attached server-side by `peerdbFetch`
 * and never exposed to the browser.
 */

import { createErrorResponse } from '@/lib/api/error-handler'
import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { PEERDB_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'
import { generateRequestId } from '@/lib/logger'
import {
  isPeerDBEnabled,
  PeerDBError,
  peerdbFetch,
} from '@/lib/peerdb/peerdb-config'

export const dynamic = 'force-dynamic'

const ROUTE = '/api/v1/peerdb'

/** Read-only allowlist: a path is permitted only if a regex here matches. */
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

function buildPath(slug: string[]): string {
  return `/v1/${slug.map((s) => encodeURIComponent(s)).join('/')}`
}

async function handle(
  method: 'GET' | 'POST',
  request: Request,
  slug: string[]
): Promise<Response> {
  const requestId = generateRequestId()

  const permissionResponse = await authorizeFeatureRequest(
    PEERDB_FEATURE_PERMISSION,
    request
  )
  if (permissionResponse) return permissionResponse

  if (!isPeerDBEnabled()) {
    return createErrorResponse(
      {
        type: ApiErrorType.NetworkError,
        message: 'PeerDB is not configured on this deployment',
      },
      503,
      { route: ROUTE, method }
    )
  }

  const path = buildPath(slug)
  if (!isAllowed(method, path)) {
    return createErrorResponse(
      {
        type: ApiErrorType.PermissionError,
        message: `Endpoint not allowed (read-only proxy): ${method} ${path}`,
      },
      403,
      { route: ROUTE, method }
    )
  }

  const url = new URL(request.url)
  const upstreamPath = url.search ? `${path}${url.search}` : path

  try {
    const body = method === 'POST' ? await request.text() : undefined
    const data = await peerdbFetch(upstreamPath, {
      method,
      ...(body ? { body } : {}),
    })

    const response = createSuccessResponse(data, {
      queryId: requestId,
      apiUrl: path,
    })
    const headers = new Headers(response.headers)
    headers.set('X-Request-ID', requestId)
    headers.set('Cache-Control', 'private, max-age=0')
    return new Response(response.body, { status: response.status, headers })
  } catch (err) {
    const status = err instanceof PeerDBError ? err.status : 500
    return createErrorResponse(
      {
        type: ApiErrorType.NetworkError,
        message: err instanceof Error ? err.message : 'PeerDB request failed',
      },
      status,
      { route: ROUTE, method }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> {
  const { slug } = await params
  return handle('GET', request, slug)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Response> {
  const { slug } = await params
  return handle('POST', request, slug)
}
