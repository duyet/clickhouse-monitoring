import packageInfo from '@/package.json'

import { NextResponse } from 'next/server'
import { fetchData } from '@/lib/clickhouse'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: clickhouse, error } = await fetchData({
    query: 'SELECT version() as version',
    hostId: 0, // Default to first host for API route
  })

  if (error) {
    return NextResponse.json(
      {
        ui: packageInfo.version,
        clickhouse: false,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ui: packageInfo.version,
    clickhouse,
  })
}
