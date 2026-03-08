import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { registerDatabasesTool } from './databases'
import { registerMergesTool } from './merges'
import { registerMetricsTool } from './metrics'
import { registerQueryTools } from './queries'
import { registerQueryTool } from './query'
import { registerTableTools } from './tables'

export function registerAllTools(server: McpServer) {
  registerQueryTool(server)
  registerDatabasesTool(server)
  registerTableTools(server)
  registerMetricsTool(server)
  registerQueryTools(server)
  registerMergesTool(server)
}
