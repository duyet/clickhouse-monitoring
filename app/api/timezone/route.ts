import { NextResponse } from 'next/server'

import { fetchData } from '@/lib/clickhouse'
import { safeArrayAccess } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export const revalidate = false

export async function GET() {
  try {
    const { data, error } = await fetchData<{ tz: string }[]>({
      query: 'SELECT timezone() as tz',
    })

    // Check for query errors
    if (error) {
      console.error('[/api/timezone] Error fetching timezone:', {
        type: error.type,
        message: error.message,
      })

      return NextResponse.json(
        {
          error: error.message,
          message: 'Failed to fetch timezone',
        },
        { status: 500 }
      )
    }

    // Safely access array data with bounds checking
    const firstRow = safeArrayAccess(data, 0)
    if (!firstRow || !firstRow.tz) {
      console.error('[/api/timezone] No timezone data returned from query')

      return NextResponse.json(
        {
          error: 'No timezone data available',
          message: 'Failed to fetch timezone',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tz: firstRow.tz,
    })
  } catch (error) {
    // Enhanced error logging with context
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('[/api/timezone] Unexpected error:', {
      message: errorMessage,
      stack: errorStack,
    })

    return NextResponse.json(
      {
        error: errorMessage,
        message: 'Failed to fetch timezone',
      },
      { status: 500 }
    )
  }
}
