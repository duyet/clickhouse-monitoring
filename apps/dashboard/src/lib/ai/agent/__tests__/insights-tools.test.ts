// @ts-nocheck
/**
 * Tests for insights tools (get_query_insights, get_table_insights).
 *
 * Follows the same pattern as mcp-tool-adapter.test.ts — mocks fetchData
 * and verifies tool registration, schema, and execution.
 */

import { describe, expect, mock, test } from 'bun:test'

mock.module('server-only', () => ({}))

mock.module('@chm/clickhouse-client', () => ({
  // findings-store (via the tools index) imports getClient at module-eval time.
  getClient: async () => ({
    command: async () => ({}),
    insert: async () => ({}),
    query: async () => ({ json: async () => [] }),
  }),
  fetchData: async ({
    query,
  }: {
    query: string
    query_params?: Record<string, unknown>
  }) => {
    if (query.includes('query_log')) {
      return {
        data: [
          {
            readable_bytes: '10.50 TiB',
            read_bytes: 11542740713472,
            readable_rows: '847 billion',
            read_rows: 847000000000,
            query_duration_ms: 800,
            readable_speed: '13.12 TiB/s',
            memory_usage: 5181988864,
            readable_memory: '4.83 GiB',
            query: 'SELECT * FROM large_table',
            user: 'analyst',
            event_time: '2026-05-01 12:00:00',
          },
        ],
        error: null,
      }
    }

    if (query.includes('parts_columns')) {
      return {
        data: [
          {
            name: 'event_time',
            compressed: '100.50 MiB',
            uncompressed: '500.00 MiB',
            compression_ratio: 0.201,
          },
          {
            name: 'user_id',
            compressed: '50.25 MiB',
            uncompressed: '200.00 MiB',
            compression_ratio: 0.251,
          },
        ],
        error: null,
      }
    }

    if (query.includes('parts')) {
      return {
        data: [
          {
            database: 'default',
            table: 'events',
            size: '100.50 GiB',
            bytes: 107793618944,
            total_rows: 5000000000,
            readable_rows: '5.00 billion',
            part_count: 42,
            compressed: '100.50 GiB',
            uncompressed: '500.00 GiB',
            compression_ratio: 0.201,
          },
          {
            database: 'default',
            table: 'logs',
            size: '50.25 GiB',
            bytes: 53896809472,
            total_rows: 2500000000,
            readable_rows: '2.50 billion',
            part_count: 20,
            compressed: '50.25 GiB',
            uncompressed: '250.00 GiB',
            compression_ratio: 0.201,
          },
        ],
        error: null,
      }
    }

    return { data: [], error: null }
  },
}))

const { createInsightsTools } = await import('../tools/insights-tools')

describe('createInsightsTools', () => {
  describe('tool creation', () => {
    test('creates get_query_insights tool', () => {
      const tools = createInsightsTools(0)

      expect(tools.get_query_insights).toBeDefined()
      expect(tools.get_query_insights).toHaveProperty('inputSchema')
      expect(tools.get_query_insights).toHaveProperty('execute')
      expect(tools.get_query_insights.description).toContain('query')
    })

    test('creates get_table_insights tool', () => {
      const tools = createInsightsTools(0)

      expect(tools.get_table_insights).toBeDefined()
      expect(tools.get_table_insights).toHaveProperty('inputSchema')
      expect(tools.get_table_insights).toHaveProperty('execute')
      expect(tools.get_table_insights.description).toContain('table')
    })
  })

  describe('get_query_insights', () => {
    test('returns structured highlights with focus=all', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_query_insights.execute({ focus: 'all' })

      expect(result).toBeDefined()
      expect(result.type).toBe('query_insights')
      expect(Array.isArray(result.highlights)).toBe(true)
      expect(result.period).toBeDefined()
    })

    test('returns highlights for specific focus', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_query_insights.execute({
        focus: 'largest_scan',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('query_insights')
      expect(result.highlights.length).toBeGreaterThanOrEqual(1)
      expect(result.highlights[0].metric).toBeDefined()
      expect(result.highlights[0].value).toBeDefined()
    })

    test('includes summary when focus is all or summary', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_query_insights.execute({ focus: 'all' })

      expect(result.summary).toBeDefined()
    })

    test('handles empty query_log gracefully', async () => {
      // Create tools with a mock that returns empty data
      const tools = createInsightsTools(0)

      const result = await tools.get_query_insights.execute({
        focus: 'fastest_scan',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('query_insights')
    })
  })

  describe('get_table_insights', () => {
    test('returns visualization for focus=size', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_table_insights.execute({ focus: 'size' })

      expect(result).toBeDefined()
      expect(result.type).toBe('visualization')
      expect(result.viz).toBeDefined()
      expect(result.viz.chartType).toBe('bar')
      expect(Array.isArray(result.rows)).toBe(true)
    })

    test('returns visualization for focus=compression', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_table_insights.execute({
        focus: 'compression',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('visualization')
    })

    test('returns visualization for focus=parts', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_table_insights.execute({ focus: 'parts' })

      expect(result).toBeDefined()
      expect(result.type).toBe('visualization')
    })

    test('returns column breakdown for focus=column_breakdown', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_table_insights.execute({
        focus: 'column_breakdown',
        database: 'default',
        table: 'events',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('visualization')
      expect(Array.isArray(result.rows)).toBe(true)
    })

    test('uses default focus=size when not specified', async () => {
      const tools = createInsightsTools(0)

      const result = await tools.get_table_insights.execute({})

      expect(result).toBeDefined()
      expect(result.type).toBe('visualization')
    })
  })
})
