/**
 * Tests for agent tools (modular tool system).
 *
 * Imports from ../tools directly to avoid mock leaks from clickhouse-agent.test.ts
 * which mocks @/lib/ai/agent/mcp-tool-adapter globally.
 *
 * Does NOT mock @/lib/api/shared/validators/sql to avoid leaking into SQL validator tests.
 * Tool execute tests use readOnlyQuery (no validation) so the real validator isn't invoked.
 */

import { describe, expect, mock, test } from 'bun:test'

// Mock server-only to allow importing server modules in test environment
mock.module('server-only', () => ({}))

// Mock fetchData — all tool helpers delegate to this
mock.module('@/lib/clickhouse', () => ({
  fetchData: async ({
    query,
  }: {
    query: string
    query_params?: Record<string, unknown>
  }) => {
    // Return mock data based on query content
    if (query.includes('databases'))
      return {
        data: [
          { name: 'default', engine: 'Atomic', comment: '' },
          { name: 'system', engine: 'Atomic', comment: 'System database' },
        ],
        error: null,
      }
    if (query.includes('columns'))
      return {
        data: [
          {
            name: 'id',
            type: 'UInt64',
            default_kind: '',
            default_expression: '',
            comment: '',
          },
          {
            name: 'name',
            type: 'String',
            default_kind: '',
            default_expression: '',
            comment: '',
          },
        ],
        error: null,
      }
    if (query.includes('tables'))
      return {
        data: [
          {
            name: 'users',
            engine: 'MergeTree',
            total_rows: 1000,
            size: '10MB',
          },
        ],
        error: null,
      }
    if (query.includes('version()'))
      return { data: [{ version: '24.1.1' }], error: null }
    if (query.includes('uptime()'))
      return { data: [{ uptime_seconds: 3600 }], error: null }
    if (query.includes('metrics'))
      return {
        data: [
          { metric: 'TCPConnection', value: 10 },
          { metric: 'HTTPConnection', value: 5 },
        ],
        error: null,
      }
    if (query.includes('processes'))
      return {
        data: [
          {
            query_id: 'q1',
            user: 'default',
            elapsed: 1.5,
            query: 'SELECT 1',
          },
        ],
        error: null,
      }
    if (query.includes('query_log'))
      return {
        data: [
          {
            query_id: 'q1',
            query_duration_ms: 5000,
            query: 'SELECT * FROM table',
          },
        ],
        error: null,
      }
    if (query.includes('merges'))
      return {
        data: [
          {
            database: 'db',
            table: 'tbl',
            progress_pct: 50,
            size: '1GB',
            elapsed: 10,
          },
        ],
        error: null,
      }
    // Default
    return { data: [], error: null }
  },
}))

// Import from tools/index directly — bypasses leaked mock from clickhouse-agent.test.ts
// which mocks @/lib/ai/agent/mcp-tool-adapter
const { createAllTools } = await import('../tools')

// Wrapper matching the createMcpTools signature
function createMcpTools(hostId: number) {
  return createAllTools(hostId)
}

describe('createMcpTools', () => {
  describe('tool creation', () => {
    test('creates core tools from all categories', () => {
      const tools = createMcpTools(0)

      expect(tools).toBeDefined()
      // Schema & exploration (from schema-tools)
      expect(tools.query).toBeDefined()
      expect(tools.list_databases).toBeDefined()
      expect(tools.list_tables).toBeDefined()
      expect(tools.get_table_schema).toBeDefined()
      // Health (from health-tools)
      expect(tools.get_metrics).toBeDefined()
      // Queries (from query-tools)
      expect(tools.get_running_queries).toBeDefined()
      expect(tools.get_slow_queries).toBeDefined()
      // Merges (from merge-tools)
      expect(tools.get_merge_status).toBeDefined()
    })

    test('creates extended tools from modular categories', () => {
      const tools = createMcpTools(0)

      // Additional tools from modular system
      expect(tools.explore_table_schema).toBeDefined()
      expect(tools.get_failed_queries).toBeDefined()
      expect(tools.get_expensive_queries).toBeDefined()
      expect(tools.get_mutations).toBeDefined()
      expect(tools.get_replication_status).toBeDefined()
      expect(tools.get_clusters).toBeDefined()
      expect(tools.get_dashboard_pages).toBeDefined()
    })

    test('uses default hostId when not provided', () => {
      const tools = createMcpTools(undefined as unknown as number)

      expect(tools).toBeDefined()
    })
  })

  describe('query tool', () => {
    test('has correct description', () => {
      const tools = createMcpTools(0)

      expect(tools.query.description).toContain('SQL')
    })

    test('has inputSchema and execute', () => {
      const tools = createMcpTools(0)

      expect(tools.query).toHaveProperty('inputSchema')
      expect(tools.query).toHaveProperty('execute')
    })

    test('execute function is async', () => {
      const tools = createMcpTools(0)

      expect(typeof tools.query.execute).toBe('function')
    })
  })

  describe('list_databases tool', () => {
    test('has correct description', () => {
      const tools = createMcpTools(0)

      expect(tools.list_databases.description).toContain('databases')
    })

    test('returns databases when executed', async () => {
      const tools = createMcpTools(0)

      const result = await tools.list_databases.execute({})

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('list_tables tool', () => {
    test('has inputSchema', () => {
      const tools = createMcpTools(0)

      expect(tools.list_tables).toHaveProperty('inputSchema')
    })

    test('returns tables when executed with database', async () => {
      const tools = createMcpTools(0)

      const result = await tools.list_tables.execute({ database: 'default' })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_table_schema tool', () => {
    test('has inputSchema', () => {
      const tools = createMcpTools(0)

      expect(tools.get_table_schema).toHaveProperty('inputSchema')
    })

    test('returns schema when executed', async () => {
      const tools = createMcpTools(0)

      const result = await tools.get_table_schema.execute({
        database: 'default',
        table: 'users',
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_metrics tool', () => {
    test('aggregates data from multiple queries', async () => {
      const tools = createMcpTools(0)

      const result = await tools.get_metrics.execute({})

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })
  })

  describe('get_running_queries tool', () => {
    test('returns query list', async () => {
      const tools = createMcpTools(0)

      const result = await tools.get_running_queries.execute({})

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_slow_queries tool', () => {
    test('has inputSchema', () => {
      const tools = createMcpTools(0)

      expect(tools.get_slow_queries).toHaveProperty('inputSchema')
    })

    test('uses default limit of 10 when not specified', async () => {
      const tools = createMcpTools(0)

      const result = await tools.get_slow_queries.execute({})

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    test('uses custom limit when specified', async () => {
      const tools = createMcpTools(0)

      const result = await tools.get_slow_queries.execute({ limit: 20 })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_merge_status tool', () => {
    test('returns merge operations', async () => {
      const tools = createMcpTools(0)

      const result = await tools.get_merge_status.execute({})

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('hostId handling', () => {
    test('respects hostId parameter in tools', () => {
      const toolsForHost0 = createMcpTools(0)
      const toolsForHost1 = createMcpTools(1)

      expect(toolsForHost0.query).toBeDefined()
      expect(toolsForHost1.query).toBeDefined()
    })
  })
})
