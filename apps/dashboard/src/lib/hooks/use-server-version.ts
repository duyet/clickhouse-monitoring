'use client'

import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/lib/swr/api-fetch'

interface HostStatusResponse {
  success: boolean
  data?: { version: string; uptime: string; hostname: string }
}

/**
 * Fetches the ClickHouse server version string for the given host.
 *
 * Reuses the /api/v1/host-status endpoint (which already queries version()).
 * Stale for 5 minutes — version only changes on server upgrade.
 */
export function useServerVersion(hostId: number) {
  return useQuery({
    queryKey: ['server-version', hostId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/host-status?hostId=${hostId}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch server version: ${res.status}`)
      }
      const json = (await res.json()) as HostStatusResponse
      return json.data?.version ?? ''
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
