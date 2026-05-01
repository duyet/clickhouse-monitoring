import { NextResponse } from 'next/server'
import { issueApiKey } from '@/lib/api-key'

const MAX_API_KEY_DAYS = 365

function getSecret(): string | null {
  return process.env.CHM_API_KEY_SECRET ?? null
}

export async function POST(request: Request) {
  const secret = getSecret()
  if (!secret) {
    return NextResponse.json(
      { error: 'CHM_API_KEY_SECRET is not configured' },
      { status: 503 }
    )
  }

  // Require the CHM_API_KEY_SECRET itself to mint keys
  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
  if (!token || token !== secret) {
    return NextResponse.json(
      { error: 'Unauthorized: provide CHM_API_KEY_SECRET as Bearer token' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const payload =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const label = typeof payload.label === 'string' ? payload.label : 'cli'
    const days = Number(payload.days ?? 30)
    if (!Number.isInteger(days) || days < 1 || days > MAX_API_KEY_DAYS) {
      return NextResponse.json(
        { error: `days must be an integer from 1 to ${MAX_API_KEY_DAYS}` },
        { status: 400 }
      )
    }

    const apiKey = await issueApiKey(label, days)
    return NextResponse.json({ data: { apiKey } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue key' },
      { status: 500 }
    )
  }
}
