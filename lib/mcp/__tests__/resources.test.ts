import { describe, expect, mock, test } from 'bun:test'

// Mock fetchData before importing
mock.module('@/lib/clickhouse', () => ({
  fetchData: async () => ({ data: [], error: null }),
}))

import { registerResources } from '../resources'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

describe('registerResources', () => {
  test('registers without errors', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' })
    expect(() => registerResources(server)).not.toThrow()
  })
})
