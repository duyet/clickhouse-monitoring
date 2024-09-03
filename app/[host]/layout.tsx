import { setHostId } from '@/lib/context'

export default function Layout({
  children,
  params: { host },
}: {
  children: React.ReactNode
  params: { host: string }
}) {
  setHostId(host)

  return <>{children}</>
}
