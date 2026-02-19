/**
 * Connection test endpoint for custom ClickHouse hosts
 * POST /api/v1/proxy/test
 *
 * Tests connectivity to a custom ClickHouse host by executing
 * a simple SELECT version() query. Returns the server version
 * on success or an error message on failure.
 */

import type { ClickHouseConfig } from '@/lib/clickhouse/types'

import { getClient } from '@/lib/clickhouse'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

interface TestRequestBody {
  host: string
  user?: string
  password?: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<TestRequestBody>

    if (!body.host) {
      return Response.json(
        { success: false, error: 'Missing required field: host' },
        { status: 400 }
      )
    }

    const clientConfig: ClickHouseConfig = {
      id: -1,
      host: body.host,
      user: body.user ?? 'default',
      password: body.password ?? '',
    }

    const client = await getClient({ clientConfig })

    const resultSet = await client.query({
      query: 'SELECT version()',
      format: 'JSONEachRow',
    })

    const data = await resultSet.json<Array<{ 'version()': string }>>()
    const version = data[0]?.['version()'] ?? 'unknown'

    return Response.json({ success: true, version })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown connection error'

    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
