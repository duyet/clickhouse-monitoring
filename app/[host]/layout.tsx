import { BackgroundJobs } from '@/components/background-jobs'
import { PageView } from '@/components/pageview'
import { setHostId } from '@/lib/server-context'
import { Suspense } from 'react'
import { cookies } from 'next/headers'

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

  // Set cookie server-side to prevent XSS vulnerability
  const cookieStore = await cookies()
  cookieStore.set('hostId', String(host), { path: '/' })

  return (
    <>
      {children}

      <Suspense fallback={null}>
        <PageView hostId={host} />
        <BackgroundJobs hostId={host} />
      </Suspense>
    </>
  )
}
