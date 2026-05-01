import { NextResponse } from 'next/server'
import { issueApiKey } from '@/lib/api-key'

function getSecret(): string | null {
  return process.env.CHM_API_KEY_SECRET ?? null
}

export async function POST(request: Request) {
  const secret = getSecret()

  // Require the CHM_API_KEY_SECRET itself to mint keys
  if (secret) {
    const auth = request.headers.get('authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token || token !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized: provide CHM_API_KEY_SECRET as Bearer token' },
        { status: 401 }
      )
    }
  }

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
