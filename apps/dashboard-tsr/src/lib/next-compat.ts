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
 * Next.js-compatible router wrapping TanStack Router.
 * Accepts Next.js navigation options (scroll, shallow, etc.) and ignores them.
 */
export function useRouter() {
  const router = useTanStackRouter()
  return {
    push: (href: string, _opts?: Record<string, unknown>) =>
      router.navigate({ to: href }),
    replace: (href: string, _opts?: Record<string, unknown>) =>
      router.navigate({ to: href, replace: true }),
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
