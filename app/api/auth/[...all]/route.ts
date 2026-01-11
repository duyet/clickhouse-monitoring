/**
 * Better Auth API routes - handles all auth endpoints
 */

import { auth } from '@/lib/auth/config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { all: string[] } }) {
  return auth.handler(request)
}

export async function POST(request: NextRequest, { params }: { params: { all: string[] } }) {
  return auth.handler(request)
}