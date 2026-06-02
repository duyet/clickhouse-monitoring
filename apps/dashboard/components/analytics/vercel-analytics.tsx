'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({
    default: mod.Analytics,
  }))
)

function NoSsr({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null
  return <>{children}</>
}

export function VercelAnalytics() {
  return (
    <NoSsr>
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </NoSsr>
  )
}
