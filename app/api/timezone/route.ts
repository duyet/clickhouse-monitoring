import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'

export const revalidate = false

export async function GET() {
  try {
    const { data } = await fetchData<{ tz: string }[]>({
      query: 'SELECT timezone() as tz',
    })

    return NextResponse.json({
      tz: data[0].tz,
    })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
