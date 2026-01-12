import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './config'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/auth/callback',
    '/api/auth/*',
    '/api/health',
  ]

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.replace('*', ''))
    }
    return pathname === route
  })

  // If it's a public route, continue
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // If no session and not on public route, redirect to login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Add user information to the request headers for server components
  if (session) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', session.user.id.toString())
    requestHeaders.set('x-user-email', session.user.email)
    requestHeaders.set('x-user-name', session.user.name || '')
    requestHeaders.set('x-user-role', session.user.role || 'user')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}