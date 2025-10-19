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

  // Convert and validate host parameter
  const hostId = Number(host)
  const validHostId = Number.isNaN(hostId) ? 0 : hostId

  setHostId(validHostId)

  // Set cookie server-side to prevent XSS vulnerability
  const cookieStore = await cookies()
  cookieStore.set('hostId', String(validHostId), { path: '/' })

  return (
    <>
      {children}

      <Suspense fallback={null}>
        <PageView hostId={validHostId} />
        <BackgroundJobs hostId={validHostId} />
      </Suspense>
    </>
  )
}
