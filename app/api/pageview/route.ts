import { getClient } from '@/lib/clickhouse'
import { normalizeUrl } from '@/lib/utils'
import type { NextRequest } from 'next/server'
import { NextResponse, userAgent } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawUrl = searchParams.get('url') || request.headers.get('referer')

  if (!rawUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
  }

  const url = normalizeUrl(rawUrl)
  const client = getClient({ web: true })

  // https://nextjs.org/docs/app/api-reference/functions/userAgent
  const ua = userAgent(request)

  try {
    await client.insert({
      table: 'system.monitoring_events',
      format: 'JSONEachRow',
      values: [
        {
          kind: 'PageView',
          data: url,
          actor: 'user',
          extra: JSON.stringify({
            browser: ua.browser,
            os: ua.os,
            device: ua.device,
            engine: ua.engine,
            cpu: ua.cpu,
            isBot: ua.isBot,
          }),
        },
      ],
    })
    console.log(`[/api/pageview] 'PageView' event created: ${request.url}`)
    return NextResponse.json({ message: 'PageView event created', url })
  } catch (error) {
    console.error(
      `[/api/pageview] 'PageView' failed create event, error: "${error}"`
    )
    return NextResponse.json(
      { error: `Error creating PageView event: ${error}` },
      { status: 500 }
    )
  }
}
