'use client'

import { FirstRunEmptyState } from './first-run-empty-state'
import { useMergedHosts } from '@/lib/swr/use-merged-hosts'

/**
 * Gates the dashboard content on having at least one configured ClickHouse
 * host. When zero hosts are configured (env + browser) the dashboard would
 * otherwise be a bare, confusing surface, so we render a first-run onboarding
 * EmptyState instead.
 *
 * While hosts are still loading we render children so existing skeletons /
 * Suspense fallbacks keep showing — we only swap in onboarding once we are
 * certain there are no hosts.
 */
export function FirstRunGate({ children }: { children: React.ReactNode }) {
  const { hosts, isLoading } = useMergedHosts()

  if (!isLoading && hosts.length === 0) {
    return <FirstRunEmptyState />
  }

  return <>{children}</>
}
