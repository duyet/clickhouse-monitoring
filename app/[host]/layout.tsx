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

  if (Number.isNaN(Number(host))) {
    setHostId(0)
  }

  setHostId(Number(host))

  return (
    <>
      {children}

      <Script
        id="setHostId"
        dangerouslySetInnerHTML={{
          // We have to set a cookie here because cookies() is not allowed in server components
          __html: `document.cookie = "hostId=${host}; path=/";`,
        }}
      />

      <Suspense fallback={null}>
        <PageView hostId={host} />
        <BackgroundJobs hostId={host} />
      </Suspense>
    </>
  )
}
