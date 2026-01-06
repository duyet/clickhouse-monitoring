import { NextResponse } from 'next/server'

// This route is dynamic and should not be statically exported
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true })
}
