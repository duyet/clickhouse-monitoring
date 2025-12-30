'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ErrorLogger } from '@/lib/logger'

export async function getHostIdCookie(
  defaultValue: number = 0
): Promise<number> {
  const cookieStore = await cookies()

  try {
    return parseInt(cookieStore.get('hostId')?.value || `${defaultValue}`, 10)
  } catch (_e) {
    // e.g. `cookies` was called outside a request scope.
    ErrorLogger.logWarning('getHostIdCookie exception', {
      component: 'scoped-link',
      action: 'getHostIdCookie',
    })
    return defaultValue
  }
}

export async function getScopedLink(path: string) {
  return `/${await getHostIdCookie()}${path}`
}

export async function redirectScoped(path: string) {
  return redirect(`/${await getHostIdCookie()}${path}`)
}
