/**
 * Dashboard settings API endpoint
 * POST /api/v1/dashboard/settings
 *
 * Updates dashboard settings in ClickHouse
 */

import { getClient } from '@/lib/clickhouse'
import type { ApiResponse, ApiError } from '@/lib/api/types'
import { ApiErrorType } from '@/lib/api/types'
import { TABLE_SETTINGS } from '@/lib/api/dashboard-api'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      params?: Record<string, string>
      hostId?: number
    }
    const { params, hostId = 0 } = body

    if (!params || typeof params !== 'object') {
      return createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Missing or invalid field: params',
        },
        400
      )
    }

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

    return createSuccessResponse({ success: true })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: errorMessage,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
      500
    )
  }
}

function createSuccessResponse<T>(data: T): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      queryId: '',
      duration: 0,
      rows: 0,
      host: '',
    },
  }

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function createErrorResponse(error: ApiError, status: number): Response {
  const response: ApiResponse = {
    success: false,
    metadata: {
      queryId: '',
      duration: 0,
      rows: 0,
      host: 'unknown',
    },
    error,
  }

  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
