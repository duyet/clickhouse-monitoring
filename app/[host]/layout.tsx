import { setHostId } from '@/lib/server-context'

export default function Layout({
  children,
  params: { host },
}: {
  children: React.ReactNode
  params: { host: string }
}) {
  if (Number.isNaN(Number(host))) {
    return children
  }

  setHostId(host)

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
