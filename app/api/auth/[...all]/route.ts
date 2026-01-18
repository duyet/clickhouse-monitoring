/**
 * Better Auth API route handler
 *
 * Handles all authentication requests via /api/auth/*
 * Compatible with static export mode - auth logic runs through API routes
 * while pages remain static shells
 *
 * Returns gracefully when auth is not configured (no database)
 */

import { NextResponse } from 'next/server'
import { isAuthEnabled } from '@/lib/auth/config'

export async function GET(request: Request) {
  // Check if auth is enabled before trying to initialize
  if (!isAuthEnabled()) {
    // Return empty session for get-session endpoint
    const url = new URL(request.url)
    if (
      url.pathname.includes('get-session') ||
      url.pathname.includes('session')
    ) {
      return NextResponse.json({ session: null, user: null })
    }
    // Return 404 for other auth endpoints when auth is disabled
    return NextResponse.json(
      { error: 'Authentication is not configured' },
      { status: 404 }
    )
  }

  try {
    const { getAuth } = await import('@/lib/auth/better-auth')
    const auth = await getAuth()
    return auth.handler(request)
  } catch (error) {
    console.error('[auth] Error handling request:', error)
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    )
  }
}

export async function POST(request: Request) {
  // Check if auth is enabled before trying to initialize
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: 'Authentication is not configured' },
      { status: 404 }
    )
  }

  try {
    const { getAuth } = await import('@/lib/auth/better-auth')
    const auth = await getAuth()
    return auth.handler(request)
  } catch (error) {
    console.error('[auth] Error handling request:', error)
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    )
  }
}
