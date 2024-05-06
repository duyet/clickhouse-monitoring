import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'

export async function GET() {
  try {
    const resp = await fetchData<{ tz: string }[]>({
      query: 'SELECT timezone() as tz',
    })
    return NextResponse.json({
      tz: resp[0].tz,
    })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
