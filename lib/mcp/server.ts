import { registerResources } from './resources'
import { registerAllTools } from './tools'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function createMcpServer() {
  const server = new McpServer({
    name: 'clickhouse-monitor',
    version: '1.0.0',
  })

  registerAllTools(server)
  registerResources(server)

  return server
}
