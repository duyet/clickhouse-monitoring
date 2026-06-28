import type { MergedHostInfo } from '@/lib/swr/use-merged-hosts'
import type { BrowserConnection } from '@/lib/types/browser-connection'

import { getBrowserConnectionSessionToken } from '@/lib/connection-sessions/session-manager'
import { apiFetch } from '@/lib/swr/api-fetch'
import { throwIfNotOk } from '@/lib/swr/fetch-error'
import { isServerHost } from '@/lib/swr/use-merged-hosts'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  metadata?: Record<string, unknown>
}

export function isCustomHost(hostId: number | undefined): boolean {
  return hostId !== undefined && hostId < 0
}

export function findMergedHost(
  hosts: MergedHostInfo[],
  hostId: number | undefined
): MergedHostInfo | undefined {
  if (hostId === undefined) return undefined
  return hosts.find((h) => h.id === hostId)
}

export async function fetchChartForHost<T>({
  chartName,
  hostId,
  hosts,
  browserConnection,
  interval,
  lastHours,
  params,
  timezone,
}: {
  chartName: string
  hostId?: number
  hosts: MergedHostInfo[]
  browserConnection?: BrowserConnection | null
  interval?: string
  lastHours?: number
  params?: Record<string, unknown>
  timezone?: string
}): Promise<{ data: T; metadata?: Record<string, unknown> }> {
  const host = findMergedHost(hosts, hostId)

  if (!host || isServerHost(host.source)) {
    const searchParams = new URLSearchParams()
    if (hostId !== undefined) searchParams.append('hostId', String(hostId))
    if (interval) searchParams.append('interval', interval)
    if (lastHours !== undefined)
      searchParams.append('lastHours', String(lastHours))
    if (params) searchParams.append('params', JSON.stringify(params))
    if (timezone) searchParams.append('timezone', timezone)
    const qs = searchParams.toString()
    const response = await apiFetch(
      `/api/v1/charts/${chartName}${qs ? `?${qs}` : ''}`
    )
    await throwIfNotOk(response, 'Failed to fetch chart data')
    return response.json() as Promise<{
      data: T
      metadata?: Record<string, unknown>
    }>
  }

  if (host.source === 'database' && host.connectionId) {
    const response = await apiFetch(
      `/api/v1/user-connections/charts/${chartName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: host.connectionId,
          interval,
          lastHours,
          params,
          timezone,
        }),
      }
    )
    await throwIfNotOk(response, 'Failed to fetch chart data')
    const json = (await response.json()) as ApiEnvelope<T>
    return { data: json.data, metadata: json.metadata }
  }

  if (host.source === 'browser' && browserConnection) {
    const sessionToken =
      await getBrowserConnectionSessionToken(browserConnection)
    const response = await apiFetch(
      `/api/v1/browser-connections/charts/${chartName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          interval,
          lastHours,
          params,
          timezone,
        }),
      }
    )
    await throwIfNotOk(response, 'Failed to fetch chart data')
    const json = (await response.json()) as ApiEnvelope<T>
    return { data: json.data, metadata: json.metadata }
  }

  throw new Error('No connection available for the selected host')
}

export async function fetchTableForHost<T>({
  queryConfigName,
  hostId,
  hosts,
  browserConnection,
  searchParams,
  timezone,
}: {
  queryConfigName: string
  hostId?: number
  hosts: MergedHostInfo[]
  browserConnection?: BrowserConnection | null
  searchParams?: Record<string, string | number | boolean | undefined>
  timezone?: string
}): Promise<{ data: T[]; metadata?: Record<string, unknown> }> {
  const host = findMergedHost(hosts, hostId)

  if (!host || isServerHost(host.source)) {
    const params = new URLSearchParams()
    if (hostId !== undefined) params.append('hostId', String(hostId))
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      }
    }
    if (timezone) params.append('timezone', timezone)
    const qs = params.toString()
    const response = await apiFetch(
      `/api/v1/tables/${queryConfigName}${qs ? `?${qs}` : ''}`
    )
    await throwIfNotOk(response, 'Failed to fetch table data')
    return response.json() as Promise<{
      data: T[]
      metadata?: Record<string, unknown>
    }>
  }

  const flatParams: Record<string, string | number | boolean> = {}
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        flatParams[key] = value as string | number | boolean
      }
    }
  }

  if (host.source === 'database' && host.connectionId) {
    const response = await apiFetch(
      `/api/v1/user-connections/tables/${queryConfigName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: host.connectionId,
          searchParams: flatParams,
          timezone,
        }),
      }
    )
    await throwIfNotOk(response, 'Failed to fetch table data')
    const json = (await response.json()) as ApiEnvelope<T[]>
    return { data: json.data, metadata: json.metadata }
  }

  if (host.source === 'browser' && browserConnection) {
    const sessionToken =
      await getBrowserConnectionSessionToken(browserConnection)
    const response = await apiFetch(
      `/api/v1/browser-connections/tables/${queryConfigName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          searchParams: flatParams,
          timezone,
        }),
      }
    )
    await throwIfNotOk(response, 'Failed to fetch table data')
    const json = (await response.json()) as ApiEnvelope<T[]>
    return { data: json.data, metadata: json.metadata }
  }

  throw new Error('No connection available for the selected host')
}
