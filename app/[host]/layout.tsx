import Script from 'next/script'

import { BackgroundJobs } from '@/components/background-jobs'
import { PageView } from '@/components/pageview'
import { generateSafeCookieScript } from '@/lib/cookie-utils'
import { setHostId } from '@/lib/server-context'
import { Suspense } from 'react'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ host: string }>
}) {
  const { host } = await params
  const hostNumber = Number(host)

  if (Number.isNaN(hostNumber)) {
    setHostId(0)
  } else {
    setHostId(hostNumber)
  }

  // Use the validated hostNumber for cookie script
  const validHostId = Number.isNaN(hostNumber) ? 0 : hostNumber

  return (
    <>
      {children}

      <Script
        id="setHostId"
        dangerouslySetInnerHTML={{
          // We have to set a cookie here because cookies() is not allowed in server components
          // Using generateSafeCookieScript to prevent XSS/cookie injection
          __html: generateSafeCookieScript('hostId', validHostId),
        }}
      />

      <Suspense fallback={null}>
        <PageView hostId={validHostId} />
        <BackgroundJobs hostId={validHostId} />
      </Suspense>
    </>
  )
}
