import { createMcpServer } from '../server'
import { describe, expect, test } from 'bun:test'

describe('MCP Server', () => {
  test('creates server instance', () => {
    const server = createMcpServer()
    expect(server).toBeDefined()
  })
})
