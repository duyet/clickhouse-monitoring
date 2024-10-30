import { type NextRequest, NextResponse } from 'next/server'

import { getClient } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'
import { initTrackingTable } from '@/lib/tracking'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hostId = searchParams.get('hostId')
    ? parseInt(searchParams.get('hostId')!)
    : await getHostIdCookie()

  const client = await getClient({ web: false, hostId })

  try {
    await initTrackingTable(client)
    return NextResponse.json({
      message: 'Ok.',
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: `${error}`,
      },
      { status: 500 }
    )
  }
}
