import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export function getHostIdCookie(defaultValue: string = '0') {
  try {
    return cookies().get('hostId')?.value || defaultValue
  } catch (e) {
    // e.g. `cookies` was called outside a request scope.
    console.error('getHostIdCookie exception:', e)
    return defaultValue
  }
}

export function getScopedLink(path: string) {
  return `/${getHostIdCookie()}${path}`
}

export function redirectScoped(path: string) {
  return redirect(`/${getHostIdCookie()}${path}`)
}
