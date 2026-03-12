/**
 * useMcpServerInfo Hook
 *
 * Fetches MCP server information including available tools and resources.
 */

import useSWR from 'swr'

import { swrConfig } from '@/lib/swr/config'

export interface McpToolParam {
  name: string
  type: string
  required: boolean
  default?: string | number
  description: string
}

export interface McpTool {
  name: string
  description: string
  params: McpToolParam[]
}

export interface McpResource {
  name: string
  uri: string
  description: string
}

export interface McpServerInfo {
  name: string
  version: string
  description: string
  tools: McpTool[]
  resources: McpResource[]
}

export interface McpServerInfoResult {
  data: McpServerInfo | undefined
  isLoading: boolean
  error: Error | undefined
}

async function fetchMcpServerInfo(): Promise<McpServerInfo> {
  const response = await fetch('/api/v1/mcp/info')
  if (!response.ok) {
    throw new Error(`Failed to fetch MCP info: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Hook to fetch MCP server information
 *
 * @returns Object with server info, loading/error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMcpServerInfo()
 *
 * if (isLoading) return <Skeleton />
 * if (error) return <ErrorAlert error={error} />
 * if (!data) return null
 *
 * return (
 *   <div>
 *     <h4>{data.name} v{data.version}</h4>
 *     <p>{data.description}</p>
 *     {/* Display tools and resources *\/}
 *   </div>
 * )
 * ```
 */
export function useMcpServerInfo(): McpServerInfoResult {
  const { data, isLoading, error } = useSWR<McpServerInfo>(
    '/api/v1/mcp/info',
    fetchMcpServerInfo,
    {
      ...swrConfig.once,
      dedupingInterval: 300_000, // Cache for 5 minutes
      shouldRetryOnError: false,
    }
  )

  return {
    data,
    isLoading,
    error,
  }
}
