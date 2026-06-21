/**
 * FetchDataError → HTTP status bridge
 *
 * The ClickHouse client (`@chm/clickhouse-client`) already classifies a failed
 * query into a `FetchDataErrorType` (e.g. an unreachable upstream / Cloudflare
 * 525/526 becomes `ssl_error`, a refused connection becomes `network_error`).
 * Those string values are intentionally identical to {@link ApiErrorType}, so a
 * route can map the client's verdict straight to the correct HTTP status instead
 * of collapsing every failure into a blanket 500.
 *
 * Why this matters: an upstream that is *down* is a 503 (Service Unavailable),
 * not a 500 (Internal Server Error). Hardcoding 500 made an infrastructure
 * outage look like an application crash. This keeps `/api/v1/charts/*` and
 * `/api/v1/overview` consistent with `/api/v1/data` and `/api/healthz`.
 */

import type { FetchDataError } from '@chm/clickhouse-client'
import type { ApiErrorType } from '@/lib/api/types'

import { getStatusCodeForErrorType } from '@/lib/api/error-handler'

/**
 * Map a {@link FetchDataError.type} to its HTTP status code.
 *
 * The cast is safe because every `FetchDataErrorType` literal has a matching
 * {@link ApiErrorType} value; unknown values fall back to 500 inside
 * {@link getStatusCodeForErrorType}.
 */
export function statusForFetchDataError(type: FetchDataError['type']): number {
  return getStatusCodeForErrorType(type as unknown as ApiErrorType)
}
