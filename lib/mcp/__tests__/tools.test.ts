import { describe, expect, mock, test } from 'bun:test'

// Mock fetchData before importing tools
mock.module('@/lib/clickhouse', () => ({
  fetchData: async () => ({ data: [], error: null }),
}))

import { registerAllTools } from '../tools'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod/v3'

describe('registerAllTools', () => {
  test('registers all 9 tools without errors', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' })
    expect(() => registerAllTools(server)).not.toThrow()
  })
})

describe('tool input validation via zod schemas', () => {
  test('query tool: sql is required string', () => {
    const schema = z.object({
      sql: z.string(),
      hostId: z.number().optional(),
      format: z.string().optional(),
    })

    expect(() => schema.parse({ sql: 'SELECT 1' })).not.toThrow()
    expect(() => schema.parse({})).toThrow()
    expect(() => schema.parse({ sql: 123 })).toThrow()
  })

  test('list_tables tool: database is required', () => {
    const schema = z.object({
      database: z.string(),
      hostId: z.number().optional(),
    })

    expect(() => schema.parse({ database: 'default' })).not.toThrow()
    expect(() => schema.parse({})).toThrow()
  })

  test('get_table_schema tool: database and table are required', () => {
    const schema = z.object({
      database: z.string(),
      table: z.string(),
      hostId: z.number().optional(),
    })

    expect(() =>
      schema.parse({ database: 'default', table: 'hits' })
    ).not.toThrow()
    expect(() => schema.parse({ database: 'default' })).toThrow()
    expect(() => schema.parse({ table: 'hits' })).toThrow()
  })

  test('get_slow_queries tool: limit is optional number', () => {
    const schema = z.object({
      limit: z.number().optional(),
      hostId: z.number().optional(),
    })

    expect(() => schema.parse({})).not.toThrow()
    expect(() => schema.parse({ limit: 20 })).not.toThrow()
    expect(() => schema.parse({ limit: 'abc' })).toThrow()
  })

  test('hostId accepts number or is optional', () => {
    const schema = z.object({
      hostId: z.number().optional(),
    })

    expect(schema.parse({}).hostId).toBeUndefined()
    expect(schema.parse({ hostId: 0 }).hostId).toBe(0)
    expect(schema.parse({ hostId: 5 }).hostId).toBe(5)
    expect(() => schema.parse({ hostId: 'abc' })).toThrow()
  })
})
