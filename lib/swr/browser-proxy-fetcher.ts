import type { BrowserConnection } from '@/lib/types/browser-connection'

/**
 * Shared error type for proxy responses
 */
export interface ProxyError extends Error {
  status?: number
  type?: string
  details?: { missingTables?: readonly string[]; [key: string]: unknown }
}

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

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: {
        message?: string
        type?: string
        details?: {
          missingTables?: readonly string[]
          [key: string]: unknown
        }
      }
    }
    const error = new Error(
      errorData.error?.message || `Proxy request failed: ${response.statusText}`
    ) as ProxyError
    error.status = response.status
    if (errorData.error) {
      error.type = errorData.error.type
      error.details = errorData.error.details
    }
    throw error
  }

  const json = (await response.json()) as ProxyResponse<T>
  return { data: json.data, metadata: json.metadata }
}
