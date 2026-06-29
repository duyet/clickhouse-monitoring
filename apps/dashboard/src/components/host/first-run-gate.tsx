import { useEffect } from 'react'
import { PageSkeleton } from '@/components/skeletons'
import { usePathname, useRouter } from '@/lib/next-compat'
import { useMergedHosts } from '@/lib/swr/use-merged-hosts'

/**
 * The frontend is a pure rendering layer; the backend is the security boundary
 * (see lib/feature-permissions/server.ts). So this gate no longer walls the whole
 * app behind an "Authentication required" screen on a 401/403 — that is not
 * something the visitor can resolve here, in `none` mode there is no sign-in at
 * all, and the workerd server can't tell an authenticated principal apart anyway.
 * Pages render; individual data calls surface their own auth / empty / error
 * states (and in `none` mode the API allows everything, so they just succeed).
 *
 * The one first-run surface we keep is genuine onboarding: zero ClickHouse hosts
 * configured — and only when that is the real state, not merely an auth failure
 * that left the host list empty. In that case we send the visitor to the stable
 * `/setup` URL (which renders FirstRunEmptyState) rather than showing the empty
 * state inline on whatever route they happened to land on. `/setup` is itself
 * wrapped by this gate, so it renders children there instead of redirecting —
 * no loop. While hosts are still loading we render children so existing
 * skeletons / Suspense fallbacks keep showing.
 *
 * NOTE: `FirstRunUnauthorizedState` is intentionally no longer rendered here. The
 * component is kept for a possible future inline sign-in prompt rather than a
 * full-page wall.
 */
export function FirstRunGate({ children }: { children: React.ReactNode }) {
  const { hosts, isLoading, isUnauthorized } = useMergedHosts()
  const router = useRouter()
  const pathname = usePathname()

  const noHosts = !isLoading && !isUnauthorized && hosts.length === 0
  const onSetup = pathname === '/setup'

  useEffect(() => {
    if (noHosts && !onSetup) {
      router.replace('/setup')
    }
  }, [noHosts, onSetup, router])

  if (noHosts && !onSetup) {
    return <PageSkeleton />
  }

  return <>{children}</>
}
