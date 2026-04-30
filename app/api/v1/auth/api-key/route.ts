import { NextResponse } from 'next/server'
import { issueApiKey } from '@/lib/api-key'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const label = typeof body.label === 'string' ? body.label : 'cli'
    const days = Number(body.days ?? 30)
    const apiKey = issueApiKey(label, Number.isFinite(days) ? days : 30)
    return NextResponse.json({ data: { apiKey } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue key' },
      { status: 500 }
    )
  }
}
