import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getHostIdCookie(
  defaultValue: number = 0
): Promise<number> {
  const cookieStore = await cookies()

  try {
    // BUG-003 FIX: Add radix parameter (10) to parseInt to ensure base-10 parsing
    // Without radix, strings starting with "0" may be interpreted as octal (base-8)
    // or strings starting with "0x" as hexadecimal (base-16), causing unexpected behavior
    const value = cookieStore.get('hostId')?.value || String(defaultValue)
    return parseInt(value, 10)
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
