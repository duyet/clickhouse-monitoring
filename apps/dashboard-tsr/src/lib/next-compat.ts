/**
 * Next.js navigation compatibility layer for TanStack Start migration.
 *
 * Provides drop-in replacements for `next/navigation` hooks so that ported
 * components work without per-file rewrites. In SPA mode (no SSR),
 * `window.location` is always available.
 */
import { useRouter as useTanStackRouter } from '@tanstack/react-router'

/**
 * Read-only search params from the current URL.
 * Returns a standard URLSearchParams (same interface as Next.js useSearchParams).
 */
export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

/**
 * Split a Next-style `href` (path with an optional `?query` string) into the
 * `{ to, search }` shape TanStack Router's `navigate` expects.
 *
 * `router.navigate({ to: '/explorer?database=default' })` treats the WHOLE
 * string as the path, so the `?query` gets percent-encoded into the pathname
 * (e.g. `/explorer%3Fdatabase=default`). Parsing the query out and passing it
 * as `search` makes ported `router.push('/path?a=b')` calls navigate correctly.
 */
function splitHref(href: string): {
  to: string
  search?: Record<string, string>
} {
  const queryIndex = href.indexOf('?')
  if (queryIndex === -1) return { to: href }
  const to = href.slice(0, queryIndex)
  const search = Object.fromEntries(
    new URLSearchParams(href.slice(queryIndex + 1))
  )
  return { to, search }
}

/**
 * Next.js-compatible router wrapping TanStack Router.
 * Accepts Next.js navigation options (scroll, shallow, etc.) and ignores them.
 */
export function useRouter() {
  const router = useTanStackRouter()
  return {
    push: (href: string, _opts?: Record<string, unknown>) =>
      router.navigate(splitHref(href)),
    replace: (href: string, _opts?: Record<string, unknown>) =>
      router.navigate({ ...splitHref(href), replace: true }),
    back: () => router.history.back(),
    forward: () => router.history.forward(),
    refresh: () => router.invalidate(),
    prefetch: (_href: string) => {
      /* no-op in SPA mode */
    },
  }
}

/**
 * Returns the current pathname (equivalent to Next.js usePathname).
 */
export function usePathname(): string {
  const router = useTanStackRouter()
  return router.state.location.pathname
}
