'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getHostIdCookie(
  defaultValue: number = 0
): Promise<number> {
  const cookieStore = await cookies()

  try {
    return parseInt(cookieStore.get('hostId')?.value || `${defaultValue}`, 10)
  } catch (e) {
    // e.g. `cookies` was called outside a request scope.
    console.error('getHostIdCookie exception:', e)
    return defaultValue
  }
}

export async function getScopedLink(path: string) {
  return `/${await getHostIdCookie()}${path}`
}

export async function redirectScoped(path: string) {
  return redirect(`/${await getHostIdCookie()}${path}`)
}
