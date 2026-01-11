/**
 * Auth configuration endpoint
 * Returns which OAuth providers are configured (without exposing secrets)
 */

import { NextResponse } from 'next/server'

export async function GET() {
  // Check which OAuth providers are configured
  const hasGithub = !!(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  )
  const hasGoogle = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  )

  // Check if auth is enabled at all
  const hasAuthSecret = !!process.env.AUTH_SECRET
  const hasDatabaseUrl = !!process.env.DATABASE_URL

  const isAuthEnabled =
    hasAuthSecret && hasDatabaseUrl && (hasGithub || hasGoogle)

  return NextResponse.json({
    enabled: isAuthEnabled,
    providers: {
      github: hasGithub,
      google: hasGoogle,
    },
  })
}
