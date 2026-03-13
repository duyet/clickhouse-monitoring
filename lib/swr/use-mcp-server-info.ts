/**
 * useMcpServerInfo Hook
 *
 * Fetches MCP server information including available tools and resources.
 * Includes retry logic with exponential backoff for transient errors.
 */

import useSWR from 'swr'

import type {
  McpResource,
  McpServerInfo,
  McpTool,
} from '@/components/mcp/mcp-tools-data'

import { swrConfig } from '@/lib/swr/config'

export interface McpServerInfoResult {
  data: McpServerInfo | undefined
  isLoading: boolean
  error: Error | undefined
  retry: () => void
}

async function fetchMcpServerInfo(): Promise<McpServerInfo> {
  const response = await fetch('/api/v1/mcp/info')
  if (!response.ok) {
    throw new Error(`Failed to fetch MCP info: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Hook to fetch MCP server information with retry support
 *
 * @returns Object with server info, loading/error states, and retry function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, retry } = useMcpServerInfo()
 *
 * if (isLoading) return <Skeleton />
 * if (error) {
 *   return (
 *     <div>
 *       <ErrorAlert error={error} />
 *       <Button onClick={retry}>Retry</Button>
 *     </div>
 *   )
 * }
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
  const { data, isLoading, error, mutate } = useSWR<McpServerInfo>(
    '/api/v1/mcp/info',
    fetchMcpServerInfo,
    {
      ...swrConfig.once,
      dedupingInterval: 300_000, // Cache for 5 minutes
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  )

  const retry = () => {
    mutate()
  }

  return {
    data,
    isLoading,
    error,
    retry,
  }
}

// Re-export types from mcp-tools-data.ts for convenience
export type { McpTool, McpResource, McpServerInfo }
