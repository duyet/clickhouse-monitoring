import { redirect } from 'next/navigation'

import { setHostId } from '@/lib/server-context'

type Params = Promise<{ host: number }>

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Params
}) {
  const { host } = await params

  if (Number.isNaN(Number(host))) {
    redirect('/')
  }

  setHostId(Number(host))

  return (
    <>
      {children}

      <script
        // We have to set a cookie here because cookies() is not allowed in server components
        dangerouslySetInnerHTML={{
          __html: `document.cookie = "hostId=${host}; path=/";`,
        }}
      />
    </>
  )
}
