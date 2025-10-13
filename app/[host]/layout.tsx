import Script from 'next/script'

import { BackgroundJobs } from '@/components/background-jobs'
import { PageView } from '@/components/pageview'
import { setHostId } from '@/lib/server-context'
import { Suspense } from 'react'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ host: number }>
}) {
  const { host } = await params

  // BUG-007 FIX: Validate and sanitize host parameter to prevent XSS attacks
  // Convert to number and validate range to ensure only safe values are used
  const hostNumber = Number(host)
  const sanitizedHost =
    Number.isNaN(hostNumber) || hostNumber < 0 ? 0 : hostNumber

  if (Number.isNaN(hostNumber)) {
    setHostId(0)
  } else {
    setHostId(sanitizedHost)
  }

  return (
    <>
      {children}

      <Script
        id="setHostId"
        dangerouslySetInnerHTML={{
          // BUG-007 FIX: Sanitize host value before injecting into script
          // Use sanitizedHost (validated number) instead of raw host parameter
          // This prevents XSS attacks through malicious host parameters
          __html: `document.cookie = "hostId=${sanitizedHost}; path=/";`,
        }}
      />

      <Suspense fallback={null}>
        <PageView hostId={sanitizedHost} />
        <BackgroundJobs hostId={sanitizedHost} />
      </Suspense>
    </>
  )
}
