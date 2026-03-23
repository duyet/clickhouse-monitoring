import { registerPrompts } from '../prompts'
import { describe, expect, test } from 'bun:test'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

describe('registerPrompts', () => {
  test('registers all 5 prompts without errors', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' })
    expect(() => registerPrompts(server)).not.toThrow()
  })

  test('server with prompts creates successfully via createMcpServer', async () => {
    const { createMcpServer } = await import('../server')
    const server = createMcpServer()
    expect(server).toBeDefined()
  })
})
