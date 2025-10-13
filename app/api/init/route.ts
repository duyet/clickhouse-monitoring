import { type NextRequest, NextResponse } from 'next/server'

import { getClient } from '@/lib/clickhouse'
import { getHostIdCookie } from '@/lib/scoped-link'
import { initTrackingTable } from '@/lib/tracking'
import { validateHostId } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hostIdParam = searchParams.get('hostId')

    // Validate hostId parameter
    let hostId: number
    if (hostIdParam) {
      const validation = validateHostId(hostIdParam)
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      hostId = validation.value!
    } else {
      hostId = await getHostIdCookie()
    }

    // Get client with validated hostId
    const client = await getClient({ web: false, hostId })

    // Initialize tracking table
    await initTrackingTable(client)

    return NextResponse.json({
      message: 'Ok.',
    })
  } catch (error) {
    // Enhanced error logging with context
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[/api/init] Error initializing tracking table:', {
      message: errorMessage,
      stack: errorStack,
    })

    // Return appropriate error response
    return NextResponse.json(
      {
        error: errorMessage,
        message: 'Failed to initialize tracking table',
      },
      { status: 500 }
    )
  }
}
