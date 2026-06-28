/**
 * Custom MCP server connection helper.
 *
 * Connects to user-supplied MCP endpoints at request time, merges their tools
 * into the agent's tool set (prefixed to avoid clobbering built-ins), and
 * provides a closeAll() for stream-end cleanup.
 *
 * Security: each endpoint passes an SSRF guard before any network call is
 * made. Private IP ranges and cloud metadata addresses are rejected; http:
 * is only permitted on loopback hosts (dev convenience).
 */

import { createMCPClient } from '@ai-sdk/mcp'

export interface CustomMcpServerInput {
  id: string
  name: string
  endpoint: string
}

export interface McpConnectionResult {
  tools: Record<string, unknown>
  closeAll: () => Promise<void>
  statuses: Array<{
    id: string
    status: 'connected' | 'error'
    toolCount: number
    error?: string
  }>
}

/** Maximum number of custom servers to connect per request. */
const MAX_SERVERS = 5

/** Per-server connect+tools timeout in milliseconds. */
const CONNECT_TIMEOUT_MS = 8_000

// ---------------------------------------------------------------------------
// URL guard
// ---------------------------------------------------------------------------

/**
 * Returns true when the URL is safe to connect to as an MCP endpoint.
 *
 * Allowed:
 *   - https: on any publicly-routable hostname
 *   - http: on localhost / 127.0.0.1 / [::1] (dev convenience)
 *
 * Rejected:
 *   - non-http/https protocols
 *   - http: on non-loopback hosts
 *   - private / reserved IPv4 literals (10.x, 172.16-31.x, 192.168.x,
 *     127.x, 169.254.x, 0.0.0.0)
 */
export function isAllowedMcpUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }

  const { protocol, hostname } = url

  if (protocol !== 'https:' && protocol !== 'http:') return false

  const isLoopback =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'

  if (protocol === 'http:') {
    // http only allowed for loopback (dev convenience)
    return isLoopback
  }

  // https: — reject private/reserved IP literals; allow DNS names
  return !isPrivateOrReservedIp(hostname)
}

/** Returns true when the hostname is a private or reserved IPv4 literal. */
function isPrivateOrReservedIp(hostname: string): boolean {
  // strip IPv6 brackets
  const h = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname

  // Loopback: 127.x.x.x
  if (/^127\./.test(h)) return true

  // Link-local / AWS metadata: 169.254.x.x
  if (/^169\.254\./.test(h)) return true

  // Private class A: 10.x.x.x
  if (/^10\./.test(h)) return true

  // Private class B: 172.16.x.x – 172.31.x.x
  const b172 = h.match(/^172\.(\d{1,3})\./)
  if (b172) {
    const octet = Number(b172[1])
    if (octet >= 16 && octet <= 31) return true
  }

  // Private class C: 192.168.x.x
  if (/^192\.168\./.test(h)) return true

  // All zeros
  if (h === '0.0.0.0') return true

  return false
}

// ---------------------------------------------------------------------------
// Name sanitisation
// ---------------------------------------------------------------------------

/**
 * Sanitise a server name into a safe tool key segment.
 * Output: lowercase [a-z0-9_], max 20 chars, never empty.
 */
export function sanitizeServerName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)
  return cleaned || 'server'
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

/**
 * Connect to a list of custom MCP servers, returning merged AI SDK tools and
 * per-server statuses.
 *
 * Each tool key is prefixed as `mcp_<sanitizedServerName>_<toolName>` so it
 * cannot collide with built-in agent tools.
 *
 * At most MAX_SERVERS (5) servers are connected; extras are recorded as errors.
 * Per-server failures are isolated — one bad server does not affect others.
 */
export async function connectCustomMcpServers(
  servers: CustomMcpServerInput[]
): Promise<McpConnectionResult> {
  const clients: Array<{ close: () => Promise<void> }> = []
  const allTools: Record<string, unknown> = {}
  const statuses: McpConnectionResult['statuses'] = []

  const toConnect = servers.slice(0, MAX_SERVERS)

  for (const server of toConnect) {
    if (!isAllowedMcpUrl(server.endpoint)) {
      statuses.push({
        id: server.id,
        status: 'error',
        toolCount: 0,
        error:
          'Endpoint URL not allowed (use https:, or http:// for localhost only)',
      })
      continue
    }

    try {
      const { client, tools } = await connectWithTimeout(
        server.endpoint,
        server.name
      )
      clients.push(client)

      const prefix = `mcp_${sanitizeServerName(server.name)}_`
      for (const [toolName, tool] of Object.entries(tools)) {
        allTools[`${prefix}${toolName}`] = tool
      }

      statuses.push({
        id: server.id,
        status: 'connected',
        toolCount: Object.keys(tools).length,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      statuses.push({
        id: server.id,
        status: 'error',
        toolCount: 0,
        error: msg.slice(0, 200),
      })
    }
  }

  // Record any servers that were silently capped
  for (const server of servers.slice(MAX_SERVERS)) {
    statuses.push({
      id: server.id,
      status: 'error',
      toolCount: 0,
      error: `Skipped: maximum of ${MAX_SERVERS} custom servers per request`,
    })
  }

  const closeAll = async () => {
    await Promise.allSettled(clients.map((c) => c.close()))
  }

  return { tools: allTools, closeAll, statuses }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Connect to an MCP endpoint and fetch its tools, with a hard timeout.
 * Cleans up the client if the timeout fires before connect completes.
 */
async function connectWithTimeout(
  endpoint: string,
  serverName: string
): Promise<{
  client: { close: () => Promise<void> }
  tools: Record<string, unknown>
}> {
  let settled = false
  let resolvedClient: { close: () => Promise<void> } | null = null

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      // Clean up any client that connected but whose tools() call timed out
      if (resolvedClient) {
        resolvedClient.close().catch(() => {})
      }
      reject(new Error(`MCP connect timed out after ${CONNECT_TIMEOUT_MS}ms`))
    }, CONNECT_TIMEOUT_MS)

    ;(async () => {
      try {
        const client = await createMCPClient({
          transport: { type: 'http', url: endpoint },
          onUncaughtError: (e) => {
            console.error(`[MCP] Uncaught error from "${serverName}":`, e)
          },
        })
        resolvedClient = client
        const tools = await client.tools()

        if (settled) {
          // Timed out while awaiting tools(); close the orphaned client
          client.close().catch(() => {})
          return
        }

        settled = true
        clearTimeout(timer)
        resolve({ client, tools: tools as Record<string, unknown> })
      } catch (e) {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(e)
      }
    })()
  })
}
