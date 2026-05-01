import { NextResponse } from 'next/server'
import { issueApiKey } from '@/lib/api-key'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const payload =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const label = typeof payload.label === 'string' ? payload.label : 'cli'
    const raw = Number(payload.days ?? 30)
    const days = Number.isFinite(raw) && raw >= 1 && raw <= 365 ? raw : 30
    const apiKey = await issueApiKey(label, days)
    return NextResponse.json({ data: { apiKey } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue key' },
      { status: 500 }
    )
  }
}
