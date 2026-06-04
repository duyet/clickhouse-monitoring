/**
 * Next.js navigation compatibility layer for TanStack Start migration.
 *
 * Provides drop-in replacements for `next/navigation` hooks so that ported
 * components work without per-file rewrites. The location hooks source state
 * from the router (reactive + SSR/prerender-safe) rather than `window`, so they
 * re-render on navigation and don't throw during the static prerender.
 */
import {
  useRouterState,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'

import { useMemo } from 'react'

/**
 * Read-only search params from the current URL.
 * Returns a standard URLSearchParams (same interface as Next.js useSearchParams).
 *
 * Sourced from the router's location state — which exists during prerender and
 * updates on navigation — so it is reactive and SSR-safe (no bare
 * `window.location` read that throws when the chrome renders on the server).
 */
export function useSearchParams(): URLSearchParams {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr })
  return new URLSearchParams(searchStr)
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
 *
 * Memoized on the (stable) TanStack router so the returned object keeps a
 * stable identity across renders — matching Next's `useRouter`. Without this
 * the fresh object literal would change every render and re-run effects that
 * depend on `[router]` (e.g. the client-side redirect routes).
 */
export function useRouter() {
  const router = useTanStackRouter()
  return useMemo(
    () => ({
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
    }),
    [router]
  )
}

/**
 * Returns the current pathname (equivalent to Next.js usePathname).
 *
 * Reads from reactive router state so chrome mounted in the persistent layout
 * (breadcrumb, the global agent's route check) updates on client-side
 * navigation instead of reading a one-shot `router.state` snapshot. Also
 * SSR-safe for the prerender.
 */
export function usePathname(): string {
  return useRouterState({ select: (s) => s.location.pathname })
}
