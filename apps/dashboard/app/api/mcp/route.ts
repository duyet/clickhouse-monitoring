import { getBearerToken, verifyApiKey } from '@chm/mcp-server/auth'
import { createMcpServer } from '@chm/mcp-server/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

export const dynamic = 'force-dynamic'

async function handleMcpRequest(req: Request) {
  const authHeader = req.headers.get('authorization')
  const bearerToken = getBearerToken(authHeader)
  const apiKeyHeader = req.headers.get('x-api-key')
  const token = bearerToken ?? apiKeyHeader
  const apiKeySecret = process.env.CHM_API_KEY_SECRET
  const authRequired =
    process.env.NODE_ENV === 'production' || Boolean(apiKeySecret)

  if (authRequired && !apiKeySecret) {
    return new Response('MCP API key auth is not configured', { status: 503 })
  }

  if (authRequired) {
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    const result = await verifyApiKey(token)
    if (!result.valid) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const server = createMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)

  return transport.handleRequest(req)
}

export const POST = handleMcpRequest
export const GET = handleMcpRequest
export const DELETE = handleMcpRequest
