/**
 * PeerDB connection status (server-side probe).
 *
 * Returns a typed, browser-safe summary the connection pill can render without
 * sniffing HTTP status codes: whether PeerDB is configured, the sanitized host
 * (origin only — never credentials), and the live reachability/auth state from
 * a cheap `/version` probe.
 */

import type { PeerDBStatusPayload } from '@/lib/peerdb/types'

import { createSuccessResponse } from '@/lib/api/shared/response-builder'
import { PEERDB_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'
import { generateRequestId } from '@/lib/logger'
import {
  getPeerDBConfig,
  PeerDBError,
  peerdbFetch,
} from '@/lib/peerdb/peerdb-config'

export const dynamic = 'force-dynamic'

interface VersionResponse {
  version?: string
}

/** Strip credentials and path so only the origin is exposed to the browser. */
function sanitizeHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    // Remove scheme, userinfo, and path - return only host:port
    let sanitized = baseUrl.replace(/^[a-z]+:\/\//i, '')
    // Remove userinfo (user:pass@) if present
    const atIndex = sanitized.indexOf('@')
    if (atIndex !== -1) {
      sanitized = sanitized.slice(atIndex + 1)
    }
    // Remove path
    return sanitized.split('/')[0]
  }
}

export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId()

  const permissionResponse = await authorizeFeatureRequest(
    PEERDB_FEATURE_PERMISSION,
    request
  )
  if (permissionResponse) return permissionResponse

  const config = getPeerDBConfig()

  if (!config) {
    return createSuccessResponse<PeerDBStatusPayload>(
      { configured: false, host: null, state: 'not-configured' },
      { queryId: requestId }
    )
  }

  const host = sanitizeHost(config.baseUrl)

  try {
    const version = await peerdbFetch<VersionResponse>('/v1/version')
    return createSuccessResponse<PeerDBStatusPayload>(
      { configured: true, host, state: 'connected', version: version.version },
      { queryId: requestId }
    )
  } catch (err) {
    const status = err instanceof PeerDBError ? err.status : 0
    const state = status === 401 || status === 403 ? 'auth' : 'unreachable'
    return createSuccessResponse<PeerDBStatusPayload>(
      {
        configured: true,
        host,
        state,
        error: err instanceof Error ? err.message : 'PeerDB probe failed',
      },
      { queryId: requestId }
    )
  }
}
