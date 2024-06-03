import packageInfo from '@/package.json'
import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'

export async function GET() {
  try {
    const { data: clickhouse } = await fetchData({
      query: 'SELECT version() as version',
    })

    return NextResponse.json({
      ui: packageInfo.version,
      clickhouse,
    })
  } catch {
    return NextResponse.json(
      {
        ui: packageInfo.version,
        clickhouse: false,
      },
      { status: 500 }
    )
  }
}
