/**
 * MCP Server Info Endpoint
 *
 * GET /api/v1/mcp/info
 *
 * Returns information about the MCP server, its tools, and resources.
 * Used by the agents sidebar to display available tools.
 */

import { NextResponse } from 'next/server'
import { MCP_TOOLS } from '@/components/mcp/mcp-tools-data'

interface McpResourceInfo {
  name: string
  uri: string
  description: string
}

interface McpServerInfo {
  name: string
  version: string
  description: string
  tools: {
    name: string
    description: string
    category: 'schema' | 'query' | 'system'
    params: Array<{
      name: string
      type: string
      required: boolean
      default?: string | number
      description: string
    }>
  }[]
  resources: McpResourceInfo[]
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const info: McpServerInfo = {
    name: 'clickhouse-monitor',
    version: '1.0.0',
    description: 'ClickHouse monitoring and query tools',
    tools: MCP_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      params: tool.params,
    })),
    resources: [
      {
        name: 'system-tables',
        uri: 'clickhouse://system-tables',
        description:
          'Reference of key ClickHouse system tables used for monitoring',
      },
      {
        name: 'query-examples',
        uri: 'clickhouse://query-examples',
        description:
          'Example SQL queries for common ClickHouse monitoring tasks',
      },
    ],
  }

  return NextResponse.json(info)
}
