'use client'

import type { HostInfo } from '@/app/api/v1/hosts/route'

import { useHosts } from './use-hosts'
import { useBrowserConnections } from '@/lib/hooks/use-browser-connections'

/**
 * Extended host info that includes the connection source.
 * Env hosts come from environment variables; browser hosts are stored in localStorage.
 */
export interface MergedHostInfo extends HostInfo {
  source: 'env' | 'browser'
}

/**
 * Combines env-configured hosts with browser-stored connections into a
 * unified, ordered array: env hosts first, then browser connections.
 *
 * @returns {Object} hosts array, loading state, error
 *
 * @example
 * ```typescript
 * const { hosts, isLoading } = useMergedHosts()
 * ```
 */
export function useMergedHosts() {
  const { hosts: envHosts, error, isLoading } = useHosts()
  const { connections, mounted } = useBrowserConnections()

  const mergedHosts: MergedHostInfo[] = [
    ...envHosts.map((h): MergedHostInfo => ({ ...h, source: 'env' })),
    ...connections.map(
      (c): MergedHostInfo => ({
        id: c.hostId,
        name: c.name,
        host: c.host,
        user: c.user,
        source: 'browser',
      })
    ),
  ]

  return {
    hosts: mergedHosts,
    error,
    isLoading: isLoading || !mounted,
  }
}
