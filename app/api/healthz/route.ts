import { NextResponse } from 'next/server'
import { getClient } from '@/lib/clickhouse/clickhouse-client'
import { getClickHouseConfigs } from '@/lib/clickhouse/clickhouse-config'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

interface HostHealth {
  host: string
  name?: string
  status: 'up' | 'down'
  latencyMs: number
  error?: string
}

export async function GET() {
  const configs = getClickHouseConfigs()

  if (configs.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'No ClickHouse hosts configured',
        hosts: [],
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  const hosts: HostHealth[] = await Promise.all(
    configs.map(async (config) => {
      const start = Date.now()
      try {
        const client = await getClient({ clientConfig: config })
        await client.query({ query: 'SELECT 1', format: 'JSON' })

        return {
          host: config.host,
          name: config.customName,
          status: 'up' as const,
          latencyMs: Date.now() - start,
        }
      } catch (err) {
        return {
          host: config.host,
          name: config.customName,
          status: 'down' as const,
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    })
  )

  const allUp = hosts.every((h) => h.status === 'up')

  return NextResponse.json(
    {
      ok: allUp,
      hosts,
      timestamp: new Date().toISOString(),
    },
    { status: allUp ? 200 : 503 }
  )
}
