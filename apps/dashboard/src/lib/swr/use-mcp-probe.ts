/**
 * useMcpProbe
 *
 * Probes a custom MCP server endpoint and returns its live connection status,
 * tool count, and tool list. Uses TanStack Query (matching the rest of the
 * codebase's data-fetching pattern) keyed by the endpoint URL so each server
 * gets an independent cache entry.
 *
 * Only fires when `enabled` is true (i.e. the server is toggled on in the
 * panel). Disabled servers are never probed.
 */

import { useQuery } from '@tanstack/react-query'

import { apiFetch } from './api-fetch'

export interface McpProbeResult {
  status: 'connected' | 'error'
  toolCount: number
  tools: string[]
  error?: string
}

async function fetchMcpProbe(
  endpoint: string,
  name: string
): Promise<McpProbeResult> {
  const response = await apiFetch('/api/v1/mcp/probe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, name }),
  })
  if (!response.ok) {
    throw new Error(`Probe failed: ${response.statusText}`)
  }
  return response.json()
}

export interface UseMcpProbeOptions {
  /** The custom server's endpoint URL. */
  endpoint: string
  /** The human-readable server name (used as the probe name). */
  name: string
  /** Only probe while this is true (i.e. the server toggle is on). */
  enabled: boolean
}

export interface UseMcpProbeResult {
  status: 'connecting' | 'connected' | 'error'
  toolCount: number
  tools: string[]
  error?: string
}

/**
 * Probe a custom MCP endpoint and return live status for the panel row.
 *
 * Returns `{ status: 'connecting' }` while the request is in-flight, then
 * `'connected'` or `'error'` from the probe response.
 */
export function useMcpProbe({
  endpoint,
  name,
  enabled,
}: UseMcpProbeOptions): UseMcpProbeResult {
  const { data, isLoading, error } = useQuery<McpProbeResult>({
    queryKey: ['/api/v1/mcp/probe', endpoint],
    queryFn: () => fetchMcpProbe(endpoint, name),
    enabled,
    staleTime: 120_000, // reuse for 2 minutes before re-probing
    retry: 1,
    refetchOnWindowFocus: false,
  })

  if (!enabled) {
    return { status: 'error', toolCount: 0, tools: [] }
  }

  if (isLoading) {
    return { status: 'connecting', toolCount: 0, tools: [] }
  }

  if (error || !data) {
    const msg = error instanceof Error ? error.message : 'Probe request failed'
    return { status: 'error', toolCount: 0, tools: [], error: msg }
  }

  return {
    status: data.status,
    toolCount: data.toolCount,
    tools: data.tools,
    error: data.error,
  }
}
