/**
 * Findings API endpoint
 * GET /api/v1/findings
 *
 * Returns recently recorded monitoring findings for a host (newest first).
 * Findings are produced by autonomous checks (cron health-sweep, the agent's
 * record_finding tool) and persisted in the app-owned findings table.
 *
 * Query parameters:
 * - host (optional, default 0): Host to read findings from
 * - severity (optional): Filter to "info" | "warning" | "critical"
 * - since (optional): Time window, e.g. "24 HOUR", "7 DAY"
 * - limit (optional, default 100, max 1000): Max findings to return
 */

import { debug, error, generateRequestId } from '@chm/logger'
import { NextResponse } from 'next/server'
import {
  type FindingSeverity,
  listRecentFindings,
} from '@/lib/findings/findings-store'

export const dynamic = 'force-dynamic'

const VALID_SEVERITIES = new Set<FindingSeverity>([
  'info',
  'warning',
  'critical',
])

export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId()

  try {
    const searchParams = new URL(request.url).searchParams

    const hostId = Number.parseInt(searchParams.get('host') ?? '0', 10)
    if (!Number.isInteger(hostId) || hostId < 0) {
      return NextResponse.json(
        { error: 'Invalid host parameter: must be a non-negative integer' },
        { status: 400 }
      )
    }

    const severityParam = searchParams.get('severity') ?? undefined
    if (
      severityParam &&
      !VALID_SEVERITIES.has(severityParam as FindingSeverity)
    ) {
      return NextResponse.json(
        { error: 'Invalid severity: must be info, warning, or critical' },
        { status: 400 }
      )
    }

    const since = searchParams.get('since') ?? undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined

    debug('[GET /api/v1/findings] Fetching findings', {
      requestId,
      hostId,
      severity: severityParam,
      since,
      limit,
    })

    const findings = await listRecentFindings(hostId, {
      severity: severityParam as FindingSeverity | undefined,
      since,
      limit,
    })

    return NextResponse.json(
      { findings, count: findings.length },
      { headers: { 'X-Request-ID': requestId } }
    )
  } catch (err) {
    error('[GET /api/v1/findings] Unexpected error:', err, { requestId })
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    )
  }
}
