import {
  apiKeyAuthEnabled,
  getBearerToken,
  verifyApiKey,
} from '@chm/mcp-server/auth'
import { clerkMiddleware } from '@clerk/nextjs/server'
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server'
import { isValidAgentApiBearerToken } from '@/lib/auth/agent-api-token'
import { getAuthProvider, isAuthProviderConfigError } from '@/lib/auth/provider'

async function getApiKeyAuthFailure(request: Request) {
  const { pathname } = new URL(request.url)

  if (!pathname.startsWith('/api/v1/')) {
    return null
  }

  if (!apiKeyAuthEnabled()) return null

  // Key issuance route has its own secret-based auth in the handler
  if (pathname === '/api/v1/auth/api-key') {
    return null
  }

  const headerToken = getBearerToken(request.headers.get('authorization'))

  if (!headerToken) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 })
  }

  const result = await verifyApiKey(headerToken)
  if (!result.valid) {
    return NextResponse.json(
      { error: `Invalid API key: ${result.reason}` },
      { status: 401 }
    )
  }

  return null
}

function normalizePathname(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

function isProtectedAgentApiRoute(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname)
  return (
    pathname === '/api/v1/agent' ||
    pathname === '/api/v1/agent/followups' ||
    pathname === '/api/v1/agent/skills' ||
    pathname === '/api/v1/agents/config-check' ||
    pathname === '/api/v1/agents/models'
  )
}

function hasPotentialClerkCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => {
    return (
      name === '__session' ||
      name.startsWith('__clerk') ||
      name.startsWith('clerk_')
    )
  })
}

async function getAgentApiClerkPrecheck(request: NextRequest) {
  if (!isProtectedAgentApiRoute(request)) {
    return null
  }

  if (await isValidAgentApiBearerToken(request)) {
    return NextResponse.next()
  }

  // Agent route handlers own the feature permission decision. Bypass Clerk for
  // requests without Clerk cookies so public agent mode and Bearer-token mode
  // are not rejected by Clerk middleware before the route can decide.
  if (
    !hasPotentialClerkCookie(request) ||
    request.headers.has('authorization')
  ) {
    return NextResponse.next()
  }

  return null
}

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  let authProvider: ReturnType<typeof getAuthProvider>

  try {
    authProvider = getAuthProvider()
  } catch (error) {
    if (isAuthProviderConfigError(error)) {
      return NextResponse.json(
        { error: 'Invalid auth provider configuration' },
        { status: 500 }
      )
    }

    throw error
  }

  const apiKeyFailure = await getApiKeyAuthFailure(request)
  if (apiKeyFailure) {
    return apiKeyFailure
  }

  if (authProvider === 'clerk') {
    const agentApiPrecheck = await getAgentApiClerkPrecheck(request)
    if (agentApiPrecheck) {
      return agentApiPrecheck
    }

    return clerkMiddleware()(request, event)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/v1/:path*', '/__clerk/:path*'],
}
