import { corsPreflight, handleMcp } from '@chm/mcp-server/http'

export const dynamic = 'force-dynamic'

// Transport/auth/CORS live in @chm/mcp-server/http, shared with the standalone
// Cloudflare MCP Worker. Wrap explicitly (not `export const POST = handleMcp`)
// because Next passes a route-context object as the second arg, which is not
// handleMcp's options shape.
function handler(req: Request): Promise<Response> {
  return handleMcp(req)
}

export const POST = handler
export const GET = handler
export const DELETE = handler

// Answer CORS preflight so cross-origin MCP clients work against the in-process
// route too (parity with the Worker, which handles OPTIONS in its router).
export function OPTIONS(): Response {
  return corsPreflight()
}
