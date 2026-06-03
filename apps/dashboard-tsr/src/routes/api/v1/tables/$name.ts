/**
 * Table-specific data endpoint
 * GET /api/v1/tables/$name?hostId=0&page=1&limit=100&sortBy=col&sortOrder=asc
 *
 * Thin wrapper using query-executor + table-registry.
 */
import { createFileRoute } from '@tanstack/react-router'

import { env } from 'cloudflare:workers'
import { error } from '@chm/logger'
import { executeTableConfig } from '@/lib/api/query-executor'
import {
  getAvailableTables,
  getTableConfig,
  hasTable,
} from '@/lib/api/table-registry'

export const Route = createFileRoute('/api/v1/tables/$name')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { name } = params
        const bindings = env as Record<string, string | undefined>
        const { searchParams } = new URL(request.url)

        // Validate hostId
        const hostIdStr = searchParams.get('hostId') ?? '0'
        const hostId = Number(hostIdStr)
        if (!Number.isFinite(hostId)) {
          return Response.json(
            {
              success: false,
              error: { type: 'validation', message: 'Invalid hostId' },
            },
            { status: 400 }
          )
        }

        // Check if table config exists
        if (!hasTable(name)) {
          return Response.json(
            {
              success: false,
              error: {
                type: 'table_not_found',
                message: `Table config not found: ${name}`,
                details: { availableTables: getAvailableTables().join(', ') },
              },
            },
            { status: 404 }
          )
        }

        const config = getTableConfig(name)
        if (!config) {
          return Response.json(
            {
              success: false,
              error: {
                type: 'query_error',
                message: `Failed to resolve table config: ${name}`,
              },
            },
            { status: 500 }
          )
        }

        // Build query params: config defaults first, then URL params override
        const queryParams: Record<string, unknown> = {
          ...(config.defaultParams ?? {}),
        }
        for (const [key, value] of searchParams.entries()) {
          if (key === 'hostId') continue
          queryParams[key] = value
        }

        // Validate timezone
        const timezoneParam = searchParams.get('timezone') || undefined
        let timezone: string | undefined
        if (timezoneParam) {
          try {
            new Intl.DateTimeFormat('en-US', {
              timeZone: timezoneParam,
            }).format(new Date())
            timezone = timezoneParam
          } catch {
            // Invalid timezone, ignore
          }
        }

        try {
          const { result, executedSql, clickhouseVersion } =
            await executeTableConfig(config, hostId, queryParams, {
              bindings,
              timezone,
            })

          if (result.error) {
            return Response.json(
              {
                success: false,
                error: {
                  type: 'query_error',
                  message: result.error.message,
                  details: result.error.details,
                },
              },
              { status: 500 }
            )
          }

          const rows = result.data ?? []
          const metadata = {
            queryId: String(result.metadata.queryId || ''),
            duration: Number(result.metadata.duration || 0),
            rows: Number(result.metadata.rows || 0),
            host: String(hostId),
            sql: executedSql.trim(),
            clickhouseVersion,
            timezone,
            rows_before_limit_at_least:
              result.metadata.rows_before_limit_at_least,
          }

          return Response.json({ success: true, data: rows, metadata })
        } catch (err) {
          error(`[GET /api/v1/tables/${name}] Unhandled exception:`, err)
          return Response.json(
            {
              success: false,
              error: {
                type: 'query_error',
                message: err instanceof Error ? err.message : 'Unknown error',
              },
            },
            { status: 500 }
          )
        }
      },
    },
  },
})
