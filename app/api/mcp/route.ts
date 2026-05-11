import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { getBearerToken } from '@/lib/auth/bearer-token'
import { verifyApiKey } from '@/lib/api-key'
import { createMcpServer } from '@/lib/mcp/server'

export const dynamic = 'force-dynamic'

async function handleMcpRequest(req: Request) {
  const authHeader = req.headers.get('authorization')
  const bearerToken = getBearerToken(authHeader)
  const apiKeyHeader = req.headers.get('x-api-key')
  const token = bearerToken ?? apiKeyHeader

  if (process.env.CHM_API_KEY_SECRET) {
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
