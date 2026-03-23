'use client'

import dynamic from 'next/dynamic'

const VERCEL_ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true'

const Analytics = VERCEL_ANALYTICS_ENABLED
  ? dynamic(
      () => import('@vercel/analytics/react').then((mod) => mod.Analytics),
      { ssr: false }
    )
  : () => null

export function VercelAnalytics() {
  return <Analytics />
}
