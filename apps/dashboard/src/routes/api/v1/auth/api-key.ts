/**
 * API Key Issuance Endpoint
 * POST /api/v1/auth/api-key
 *
 * Mints a signed API key for use with the MCP server.
 * Requires CHM_API_KEY_SECRET as a Bearer token to authorize issuance.
 *
 * Ported from apps/dashboard/app/api/v1/auth/api-key/route.ts.
 * - next/server NextResponse.json(x, init) -> Response.json(x, init).
 * - Depends on @chm/mcp-server/auth (getBearerToken, issueApiKey). That subpath
 *   needs a vite alias in dashboard (the generic @chm/mcp-server entry is
 *   NOT aliased — only /http and /data are). See reported neededConfig.
 */

import { createFileRoute } from '@tanstack/react-router'

import { getBearerToken, issueApiKey } from '@chm/mcp-server/auth'

const MAX_API_KEY_DAYS = 365

function getSecret(): string | null {
  return process.env.CHM_API_KEY_SECRET ?? null
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  if (aBytes.length !== bBytes.length) return false

  let diff = 0
  for (let index = 0; index < aBytes.length; index += 1) {
    diff |= aBytes[index] ^ bBytes[index]
  }

  return diff === 0
}

async function handlePost(request: Request): Promise<Response> {
  const secret = getSecret()
  if (!secret) {
    return Response.json(
      { error: 'CHM_API_KEY_SECRET is not configured' },
      { status: 503 }
    )
  }

  // Require the CHM_API_KEY_SECRET itself to mint keys
  const token = getBearerToken(request.headers.get('authorization'))
  if (!token || !timingSafeEqualString(token, secret)) {
    return Response.json(
      { error: 'Unauthorized: provide CHM_API_KEY_SECRET as Bearer token' },
      { status: 401 }
    )
  }

  try {
    const rawBody = await request.text()
    let payload: Record<string, unknown> = {}
    if (rawBody.trim()) {
      try {
        const body = JSON.parse(rawBody) as unknown
        payload =
          body && typeof body === 'object'
            ? (body as Record<string, unknown>)
            : {}
      } catch {
        return Response.json(
          { error: 'Request body must be valid JSON' },
          { status: 400 }
        )
      }
    }

    const label = typeof payload.label === 'string' ? payload.label : 'cli'
    const days = Number(payload.days ?? 30)
    if (!Number.isInteger(days) || days < 1 || days > MAX_API_KEY_DAYS) {
      return Response.json(
        { error: `days must be an integer from 1 to ${MAX_API_KEY_DAYS}` },
        { status: 400 }
      )
    }

    const apiKey = await issueApiKey(label, days)
    return Response.json({ data: { apiKey } })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to issue key' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/v1/auth/api-key')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
    },
  },
})
