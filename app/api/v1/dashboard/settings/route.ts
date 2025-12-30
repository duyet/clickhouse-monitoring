/**
 * Dashboard settings API endpoint
 * POST /api/v1/dashboard/settings
 *
 * Updates dashboard settings in ClickHouse
 */

import { TABLE_SETTINGS } from '@/lib/api/dashboard-api'
import {
  createErrorResponse as createApiErrorResponse,
  createValidationError,
} from '@/lib/api/error-handler'
import type { ApiResponse } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { getClient } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

const ROUTE_CONTEXT = { route: '/api/v1/dashboard/settings', method: 'POST' }

export async function POST(request: Request): Promise<Response> {
  debug('[POST /api/v1/dashboard/settings] Updating settings')

  try {
    const body = (await request.json()) as {
      params?: Record<string, string>
      hostId?: number
    }
    const { params, hostId = 0 } = body

    if (!params || typeof params !== 'object') {
      return createValidationError(
        'Missing or invalid field: params',
        ROUTE_CONTEXT
      )
    }

    debug('[POST /api/v1/dashboard/settings]', {
      hostId,
      paramsKeys: Object.keys(params),
    })

    const query = `
      ALTER TABLE ${TABLE_SETTINGS}
      UPDATE value = {value:String}, updated_at = NOW()
      WHERE key = {key:String}
    `

    const query_params = {
      key: 'params',
      value: JSON.stringify(params),
    }

    // getClient will auto-detect and use web client for Cloudflare Workers
    const client = await getClient({ hostId: Number(hostId) })
    await client.command({
      query,
      query_params,
    })

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      metadata: {
        queryId: 'dashboard-settings-update',
        duration: 0,
        rows: 0,
        host: String(hostId),
      },
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'

    error('[POST /api/v1/dashboard/settings] Error:', errorMessage)

    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500,
      ROUTE_CONTEXT
    )
  }
}
