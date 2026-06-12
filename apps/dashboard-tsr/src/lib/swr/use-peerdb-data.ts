import { useQuery, useQueryClient } from '@tanstack/react-query'

import type { ApiResponse } from '@/lib/api/types'

import { apiFetch } from './api-fetch'
import { visibilityAwareInterval } from './config'
import { type FetchError, throwIfNotOk } from './fetch-error'
import { useCallback } from 'react'

/**
 * SWR hook for the view-only PeerDB proxy at `/api/v1/peerdb/*`.
 *
 * `path` is the PeerDB API path WITHOUT the `/v1` prefix (the proxy adds it),
 * e.g. `/mirrors/list`. Pass `null` to disable fetching (conditional SWR).
 * When `body` is provided the request is POSTed (PeerDB uses POST for status,
 * graph, batches, logs, and lag_history); otherwise GET.
 *
 * The proxy wraps payloads in the standard `ApiResponse` envelope, so the
 * fetcher unwraps `.data` and returns the bare PeerDB payload.
 */
export function usePeerDB<T = unknown>(
  path: string | null,
  options?: {
    body?: unknown
    refreshInterval?: number
  }
) {
  const { body, refreshInterval } = options ?? {}
  const hasBody = body !== undefined
  const method = hasBody ? 'POST' : 'GET'
  const bodyKey = hasBody ? JSON.stringify(body) : ''

  // Tolerate callers passing `mirrors/list` or `/mirrors/list` alike so the
  // proxy URL never collapses to `/api/v1/peerdbmirrors/list`.
  const normalizedPath =
    path === null ? null : path.startsWith('/') ? path : `/${path}`
  const key =
    normalizedPath === null ? null : ['peerdb', normalizedPath, method, bodyKey]

  const fetcher = useCallback(async (): Promise<T> => {
    try {
      const response = await apiFetch(`/api/v1/peerdb${normalizedPath}`, {
        method,
        ...(hasBody
          ? { headers: { 'Content-Type': 'application/json' }, body: bodyKey }
          : {}),
      })
      await throwIfNotOk(response, `Failed to fetch PeerDB ${normalizedPath}`)
      const json = (await response.json()) as ApiResponse<T>
      return json.data as T
    } catch (err) {
      // Re-shape for consistent messaging, but preserve the status/type/details
      // that throwIfNotOk attaches — pages rely on `status === 503` to detect
      // the not-configured state (isPeerDBNotConfigured).
      const src = err as FetchError
      const wrapped = new Error(
        `Failed to fetch PeerDB ${normalizedPath}: ${
          err instanceof Error ? err.message : String(err)
        }`
      ) as FetchError
      wrapped.status = src.status
      wrapped.type = src.type
      wrapped.details = src.details
      throw wrapped
    }
  }, [normalizedPath, method, bodyKey, hasBody])

  const queryClient = useQueryClient()

  const { data, error, isLoading, isFetching } = useQuery<T, Error>({
    queryKey: key ?? ['peerdb', 'disabled'],
    queryFn: fetcher,
    enabled: Boolean(key),
    refetchOnReconnect: true,
    staleTime: 3000,
    retry: false,
    refetchInterval:
      refreshInterval && refreshInterval > 0
        ? visibilityAwareInterval(refreshInterval)
        : false,
  })

  const mutate = () =>
    queryClient.invalidateQueries({ queryKey: key ?? ['peerdb', 'disabled'] })

  return { data, error, isLoading, isValidating: isFetching, refresh: mutate }
}
