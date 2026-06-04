import { FirstRunEmptyState } from './first-run-empty-state'
import { FirstRunUnauthorizedState } from './first-run-unauthorized-state'
import { useMergedHosts } from '@/lib/swr/use-merged-hosts'

/**
 * Gates the dashboard content on having at least one configured ClickHouse
 * host. Two first-run surfaces replace the bare, confusing default:
 *
 *  - unauthorized (hosts fetch 401/403) → prompt to sign in
 *  - zero hosts configured (env + browser) → onboarding EmptyState
 *
 * While hosts are still loading we render children so existing skeletons /
 * Suspense fallbacks keep showing — we only swap in onboarding once we are
 * certain about the state.
 */
export function FirstRunGate({ children }: { children: React.ReactNode }) {
  const { hosts, isLoading, isUnauthorized } = useMergedHosts()

  if (!isLoading && isUnauthorized) {
    return <FirstRunUnauthorizedState />
  }

  if (!isLoading && hosts.length === 0) {
    return <FirstRunEmptyState />
  }

  return <>{children}</>
}
