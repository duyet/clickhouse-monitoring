import packageInfo from '@/package.json'

import { fetchData } from '@chm/clickhouse-client'
import { NextResponse } from 'next/server'

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
