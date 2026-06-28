/**
 * MCP probe endpoint — POST /api/v1/mcp/probe
 *
 * Validates and test-connects to a user-supplied MCP endpoint so the panel
 * can show real connection status and tool counts without waiting for a full
 * agent request.
 *
 * Auth: same as the agent route (authorizeAgentApiRequest).
 */

import { createFileRoute } from '@tanstack/react-router'

import { connectCustomMcpServers } from '@/lib/ai/agent/mcp/connect-custom-servers'
import { authorizeAgentApiRequest } from '@/lib/auth/agent-api-auth'

interface ProbeRequestBody {
  endpoint: string
  name?: string
}

interface ProbeResponse {
  status: 'connected' | 'error'
  toolCount: number
  tools: string[]
  error?: string
}

async function handlePost(request: Request): Promise<Response> {
  const authResponse = await authorizeAgentApiRequest(request)
  if (authResponse) return authResponse

  let body: ProbeRequestBody
  try {
    const raw = await request.json()
    if (
      typeof raw !== 'object' ||
      raw === null ||
      typeof (raw as Record<string, unknown>).endpoint !== 'string'
    ) {
      throw new Error('INVALID_PAYLOAD')
    }
    body = raw as ProbeRequestBody
  } catch {
    return Response.json(
      { error: 'Invalid JSON payload — "endpoint" (string) is required' },
      { status: 400 }
    )
  }

  const endpoint = body.endpoint.trim()
  const name = typeof body.name === 'string' ? body.name.trim() : 'probe'

  let mcpResult
  try {
    mcpResult = await connectCustomMcpServers([
      { id: 'probe', name: name || 'probe', endpoint },
    ])
  } finally {
    // closeAll is called whether connect succeeded or not
    if (mcpResult) {
      await mcpResult.closeAll().catch(() => {})
    }
  }

  const [status] = mcpResult.statuses
  const toolNames = Object.keys(mcpResult.tools)

  const responseBody: ProbeResponse = {
    status: status?.status ?? 'error',
    toolCount: status?.toolCount ?? 0,
    tools: toolNames,
    ...(status?.error !== undefined ? { error: status.error } : {}),
  }

  return Response.json(responseBody)
}

export const Route = createFileRoute('/api/v1/mcp/probe')({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
    },
  },
})
