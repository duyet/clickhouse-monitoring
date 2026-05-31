/**
 * Batched Table Availability API endpoint
 * GET /api/v1/table-availability?hostId=<n>
 *
 * Returns a map of every ClickHouse system table referenced in the menu to its
 * availability status (boolean) on the current host in a single request.
 *
 * This enables the sidebar to dim/mute optional features whose system tables are not
 * configured or supported, without blocking initial rendering.
 *
 * SECURITY: Only table checks defined in menu.ts are executed.
 */

import { menuItemsConfig } from '@/menu'
import type { MenuItem } from '@/components/menu/types'

import { checkTableExists } from '@chm/clickhouse-client/table-existence-cache'
import { debug, error, generateRequestId } from '@chm/logger'
import { createErrorResponse } from '@/lib/api/error-handler'
import { HostIdSchema } from '@/lib/api/schemas'
import {
  CacheControl,
  createSuccessResponse,
} from '@/lib/api/shared/response-builder'
import { ApiErrorType } from '@/lib/api/types'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'

export const dynamic = 'force-dynamic'

const ROUTE_CONTEXT = { route: '/api/v1/table-availability', method: 'GET' }

interface TableAvailabilityResponse {
  readonly available: Record<string, boolean>
}

/**
 * Extracts all unique table checks declared in the menu items.
 */
function extractTableChecks(items: readonly MenuItem[]): string[] {
  const tables = new Set<string>()

  function recurse(menuItems: readonly MenuItem[]) {
    for (const item of menuItems) {
      if (item.tableCheck) {
        const itemTables = Array.isArray(item.tableCheck) ? item.tableCheck : [item.tableCheck]
        for (const t of itemTables) {
          tables.add(t)
        }
      }
      if (item.items) {
        recurse(item.items)
      }
    }
  }

  recurse(items)
  return Array.from(tables)
}

/**
 * Finds all menu items referencing a specific table.
 */
function findMenuItemsForTable(items: readonly MenuItem[], table: string): MenuItem[] {
  const result: MenuItem[] = []

  function recurse(menuItems: readonly MenuItem[]) {
    for (const item of menuItems) {
      if (item.tableCheck) {
        const itemTables = Array.isArray(item.tableCheck) ? item.tableCheck : [item.tableCheck]
        if (itemTables.includes(table)) {
          result.push(item)
        }
      }
      if (item.items) {
        recurse(item.items)
      }
    }
  }

  recurse(items)
  return result
}

/**
 * Authorizes the table check by verifying if the user has permission
 * to view at least one menu item backed by this table.
 */
async function isTableAuthorized(
  table: string,
  request: Request
): Promise<boolean> {
  const items = findMenuItemsForTable(menuItemsConfig, table)
  if (items.length === 0) return true

  for (const item of items) {
    const permission = item.permission
    const permissionResponse = await authorizeFeatureRequest(permission, request)
    if (!permissionResponse) {
      // User is authorized for at least one feature using this table
      return true
    }
  }

  return false
}

/**
 * Resolves a single table check to its availability status.
 */
async function resolveTableAvailability(
  table: string,
  hostId: number,
  request: Request,
  requestId: string
): Promise<boolean | undefined> {
  // Security/Permission check
  const authorized = await isTableAuthorized(table, request)
  if (!authorized) {
    return undefined // Omit unauthorized tables from the map
  }

  // Parse database and table names
  const parts = table.split('.')
  const db = parts.length > 1 ? parts[0] : 'system'
  const tbl = parts.length > 1 ? parts[1] : parts[0]

  try {
    const exists = await checkTableExists(hostId, db, tbl)
    return exists
  } catch (err) {
    error('[GET /api/v1/table-availability] Check table error:', err, {
      requestId,
      table,
      hostId,
    })
    return false // Fail-soft on error
  }
}

export async function GET(request: Request): Promise<Response> {
  const requestId = generateRequestId()

  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Validate hostId parameter
    const hostIdResult = HostIdSchema.safeParse(
      searchParams.get('hostId') ?? '0'
    )
    if (!hostIdResult.success) {
      error('[GET /api/v1/table-availability] Invalid hostId parameter', undefined, {
        requestId,
      })
      const errorResponse = createErrorResponse(
        {
          type: ApiErrorType.ValidationError,
          message: 'Invalid hostId parameter: must be a non-negative integer',
        },
        400,
        ROUTE_CONTEXT
      )
      const headers = new Headers(errorResponse.headers)
      headers.set('X-Request-ID', requestId)
      return new Response(errorResponse.body, {
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        headers,
      })
    }

    const hostId = hostIdResult.data

    debug('[GET /api/v1/table-availability] Fetching table availability', {
      requestId,
      hostId,
    })

    const tables = extractTableChecks(menuItemsConfig)
    const resolved = await Promise.all(
      tables.map(async (table) => {
        const available = await resolveTableAvailability(table, hostId, request, requestId)
        return [table, available] as const
      })
    )

    const available: Record<string, boolean> = {}
    for (const [table, status] of resolved) {
      if (status !== undefined) {
        available[table] = status
      }
    }

    debug('[GET /api/v1/table-availability] Batched availability result:', {
      requestId,
      tablesToCheck: tables.length,
      availableTablesCount: Object.keys(available).length,
    })

    const response = createSuccessResponse<TableAvailabilityResponse>(
      { available },
      { queryId: 'table-availability-batch', rows: Object.keys(available).length }
    )

    const headers = new Headers(response.headers)
    headers.set('X-Request-ID', requestId)
    headers.set('Cache-Control', CacheControl.MEDIUM)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (err) {
    error('[GET /api/v1/table-availability] Unexpected error:', err, { requestId })
    const errorResponse = createErrorResponse(
      {
        type: ApiErrorType.QueryError,
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      500,
      ROUTE_CONTEXT
    )
    const headers = new Headers(errorResponse.headers)
    headers.set('X-Request-ID', requestId)
    return new Response(errorResponse.body, {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      headers,
    })
  }
}
