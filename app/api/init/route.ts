import { getClient } from '@/lib/clickhouse'
import { initTrackingTable } from '@/lib/tracking'
import { NextResponse } from 'next/server'

export async function GET() {
  const client = getClient({ web: false })

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
