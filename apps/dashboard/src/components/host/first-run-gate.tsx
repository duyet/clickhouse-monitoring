import { FirstRunEmptyState } from './first-run-empty-state'
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
 * that left the host list empty. While hosts are still loading we render children
 * so existing skeletons / Suspense fallbacks keep showing.
 *
 * NOTE: `FirstRunUnauthorizedState` is intentionally no longer rendered here. The
 * component is kept for a possible future inline sign-in prompt rather than a
 * full-page wall.
 */
export function FirstRunGate({ children }: { children: React.ReactNode }) {
  const { hosts, isLoading, isUnauthorized } = useMergedHosts()

  if (!isLoading && !isUnauthorized && hosts.length === 0) {
    return <FirstRunEmptyState />
  }

  return <>{children}</>
}
