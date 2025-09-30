import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'
import packageInfo from '@/package.json'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: clickhouse, error } = await fetchData({
    query: 'SELECT version() as version',
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
