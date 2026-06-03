import { useQuery } from '@tanstack/react-query'

import type { ApiResponse } from '@/lib/api/types'
import type { PeerDBStatusPayload } from '@/lib/peerdb/types'

import { apiFetch } from '@/lib/swr/api-fetch'

const STATUS_URL = '/api/v1/peerdb-status'

async function fetchStatus(url: string): Promise<PeerDBStatusPayload> {
  try {
    const response = await apiFetch(url)
    if (!response.ok) {
      throw new Error(`PeerDB status probe failed (${response.status})`)
    }
    const json = (await response.json()) as ApiResponse<PeerDBStatusPayload>
    const data = json?.data
    if (!data || typeof data.state !== 'string') {
      throw new Error('Malformed PeerDB status response')
    }
    return data
  } catch (err) {
    throw new Error(
      `Failed to fetch PeerDB status: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
}

/**
 * Shared SWR hook for the server-side PeerDB connection probe. Validates the
 * response shape so callers (the header pill + mirrors header chip) never
 * consume malformed data.
 */
export function usePeerDBStatus(refreshInterval = 60_000) {
  return useQuery<PeerDBStatusPayload>({
    queryKey: [STATUS_URL],
    queryFn: () => fetchStatus(STATUS_URL),
    refetchInterval: refreshInterval,
    retry: false,
  })
}
