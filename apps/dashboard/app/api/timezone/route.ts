import { fetchData } from '@chm/clickhouse-client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = false

export async function GET() {
  const { data, error } = await fetchData<{ tz: string }[]>({
    query: 'SELECT timezone() as tz',
    hostId: 0,
  })

  if (error || !data?.length) {
    return NextResponse.json({}, { status: 500 })
  }

  return NextResponse.json({
    tz: data[0].tz,
  })
}
