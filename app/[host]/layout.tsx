import { setHostId } from '@/lib/server-context'
import { redirect } from 'next/navigation'

export default function Layout({
  children,
  params: { host },
}: {
  children: React.ReactNode
  params: { host: number }
}) {
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
