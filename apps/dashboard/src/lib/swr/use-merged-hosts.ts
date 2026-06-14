import type { HostInfo } from '@chm/types/host-info'

import { useHosts } from './use-hosts'
import { useBrowserConnections } from '@/lib/hooks/use-browser-connections'
import { useUserConnections } from '@/lib/hooks/use-user-connections'

/**
 * Extended host info that includes the connection source.
 * Env hosts come from environment variables; browser hosts are stored in localStorage.
 */
export interface MergedHostInfo extends HostInfo {
  source: 'env' | 'browser' | 'database'
  /** Server-stored connection UUID when source is database. */
  connectionId?: string
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
  const { hosts: envHosts, error, isLoading, isUnauthorized } = useHosts()
  const { connections, mounted, getConnectionByHostId } =
    useBrowserConnections()
  const {
    connections: dbConnections,
    isLoading: dbLoading,
    featureEnabled: dbFeatureEnabled,
  } = useUserConnections()

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
    ...(dbFeatureEnabled
      ? dbConnections.map(
          (c): MergedHostInfo => ({
            id: c.hostId,
            name: c.name,
            host: c.host,
            user: c.user,
            source: 'database',
            connectionId: c.id,
          })
        )
      : []),
  ]

  return {
    hosts: mergedHosts,
    error,
    // Only the env-host fetch can be unauthorized; browser connections are local.
    isUnauthorized: Boolean(isUnauthorized),
    isLoading: isLoading || !mounted || (dbFeatureEnabled && dbLoading),
    getConnectionByHostId,
  }
}
