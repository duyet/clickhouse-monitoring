import packageInfo from '@/package.json'
import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'

export async function GET() {
  try {
    const clickhouse = await fetchData('SELECT version()')
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
