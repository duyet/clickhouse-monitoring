/**
 * Dashboard settings API endpoint
 * GET /api/v1/dashboard/settings - Retrieve dashboard settings
 * POST /api/v1/dashboard/settings - Update dashboard settings
 */

import type { ApiResponse } from '@/lib/api/types'

import { TABLE_SETTINGS } from '@/lib/api/dashboard-api'
import {
  createErrorResponse as createApiErrorResponse,
  createValidationError,
} from '@/lib/api/error-handler'
import { ApiErrorType } from '@/lib/api/types'
import { getClient } from '@/lib/clickhouse'
import { debug, error } from '@/lib/logger'

const ROUTE_CONTEXT_GET = { route: '/api/v1/dashboard/settings', method: 'GET' }
const ROUTE_CONTEXT_POST = {
  route: '/api/v1/dashboard/settings',
  method: 'POST',
}

export async function GET(request: Request): Promise<Response> {
  debug('[GET /api/v1/dashboard/settings] Fetching settings')

  try {
    const { searchParams } = new URL(request.url)
    const hostId = Number(searchParams.get('hostId') ?? '0')

    debug('[GET /api/v1/dashboard/settings]', { hostId })

    const query = `
      SELECT key, value
      FROM ${TABLE_SETTINGS}
    `

    const client = await getClient({ hostId })
    const resultSet = await client.query({
      query,
    })

    const rows = await resultSet.json()

    // Convert rows to a key-value object
    const params = Array.isArray(rows)
      ? rows.reduce(
          (acc, row: { key: string; value: string }) => {
            acc[row.key] = row.value
            return acc
          },
          {} as Record<string, string>
        )
      : {}

    const response: ApiResponse<{ params: Record<string, string> }> = {
      success: true,
      data: { params },
      metadata: {
        queryId: 'dashboard-settings-get',
        duration: 0,
        rows: Array.isArray(rows) ? rows.length : 0,
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

    error('[GET /api/v1/dashboard/settings] Error:', errorMessage)

    // If table doesn't exist yet, return empty params
    if (
      errorMessage.includes('Table') &&
      errorMessage.includes("doesn't exist")
    ) {
      const response: ApiResponse<{ params: Record<string, string> }> = {
        success: true,
        data: { params: {} },
        metadata: {
          queryId: 'dashboard-settings-get',
          duration: 0,
          rows: 0,
          host: '0',
        },
      }

      return Response.json(response, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return createApiErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500,
      ROUTE_CONTEXT_GET
    )
  }
}

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
        ROUTE_CONTEXT_POST
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
      ROUTE_CONTEXT_POST
    )
  }
}
