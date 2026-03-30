import type { BrowserConnection } from '@/lib/types/browser-connection'

import { throwIfNotOk } from './fetch-error'

/**
 * Parameters for the browser proxy fetch
 */
interface BrowserProxyFetchParams {
  connection: BrowserConnection
  query: string
  queryParams?: Record<string, string | number | boolean>
  format?: string
}

/**
 * Generic response from the proxy endpoint
 */
interface ProxyResponse<T = unknown> {
  success: boolean
  data: T[]
  metadata: Record<string, unknown>
}

/**
 * Sends a query through the browser connections proxy endpoint.
 * Shared between useChartData and useTableData hooks.
 */
export async function fetchViaBrowserProxy<T = unknown>({
  connection,
  query,
  queryParams,
  format = 'JSONEachRow',
}: BrowserProxyFetchParams): Promise<{
  data: T[]
  metadata: Record<string, unknown>
}> {
  const response = await fetch('/api/v1/browser-connections/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connection: {
        host: connection.host,
        user: connection.user,
        password: connection.password,
      },
      query,
      query_params: queryParams,
      format,
    }),
  })

  await throwIfNotOk(response, 'Proxy request failed')

  const json = (await response.json()) as ProxyResponse<T>
  return { data: json.data, metadata: json.metadata }
}
