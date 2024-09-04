import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import serverContext from 'server-only-context'

export const [getHostId, setHostId] = serverContext('0')

export const getHostIdCookie = () => {
  return cookies().get('hostId')?.value || '0'
}

export function getScopedLink(path: string) {
  return `/${getHostIdCookie()}${path}`
}

export function redirectScoped(path: string) {
  return redirect(`/${getHostIdCookie()}${path}`)
}
