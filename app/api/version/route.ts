import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'
import packageInfo from '@/package.json'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: clickhouse, error } = await fetchData({
      query: 'SELECT version() as version',
      hostId: 0, // Default to first host for API route
    })

    if (error) {
      console.error('[/api/version] Error fetching ClickHouse version:', {
        type: error.type,
        message: error.message,
      })

      return NextResponse.json(
        {
          ui: packageInfo.version,
          clickhouse: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ui: packageInfo.version,
      clickhouse,
    })
  } catch (error) {
    // Enhanced error logging with context
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[/api/version] Unexpected error:', {
      message: errorMessage,
      stack: errorStack,
    })

    return NextResponse.json(
      {
        ui: packageInfo.version,
        clickhouse: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
