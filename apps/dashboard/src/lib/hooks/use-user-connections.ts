import { useQuery, useQueryClient } from '@tanstack/react-query'

import { isFeatureEnabled } from '@/lib/feature-flags'
import { apiFetch } from '@/lib/swr/api-fetch'
import { throwIfNotOk } from '@/lib/swr/fetch-error'

export interface UserConnectionInfo {
  id: string
  name: string
  host: string
  user: string
  hostId: number
  source: 'database'
  createdAt?: number
  updatedAt?: number
}

interface UserConnectionsResponse {
  success: boolean
  data: UserConnectionInfo[]
}

const QUERY_KEY = ['/api/v1/user-connections'] as const

export function useUserConnections(enabled = true) {
  const featureEnabled = isFeatureEnabled('userConnectionsDb')

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await apiFetch('/api/v1/user-connections')
      await throwIfNotOk(response, 'Failed to load user connections')
      const json = (await response.json()) as UserConnectionsResponse
      return json.data ?? []
    },
    enabled: enabled && featureEnabled,
    staleTime: 30_000,
  })

  return {
    connections: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    featureEnabled,
  }
}

export function useUserConnectionsMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const createConnection = async (input: {
    name: string
    host: string
    user: string
    password: string
  }): Promise<{
    success: boolean
    data: UserConnectionInfo
  }> => {
    const response = await apiFetch('/api/v1/user-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    await throwIfNotOk(response, 'Failed to save connection')
    await invalidate()
    return response.json() as Promise<{
      success: boolean
      data: UserConnectionInfo
    }>
  }

  const deleteConnection = async (id: string) => {
    const response = await apiFetch(`/api/v1/user-connections/${id}`, {
      method: 'DELETE',
    })
    await throwIfNotOk(response, 'Failed to delete connection')
    await invalidate()
  }

  return { createConnection, deleteConnection, invalidate }
}
