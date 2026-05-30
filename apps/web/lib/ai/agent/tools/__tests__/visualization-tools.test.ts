import { describe, expect, mock, test } from 'bun:test'
import { z } from 'zod/v3'

mock.module('server-only', () => ({}))

const routeQuery = (q: string) => {
  // discover_data_sources: matched tables query
  if (q.includes('matched_tables')) {
    return [
      {
        database: 'analytics',
        table: 'events',
        engine: 'MergeTree',
        total_rows: 1000000,
        size: '1.00 GiB',
        comment: 'Event data table',
      },
    ]
  }

  // discover_data_sources: column listing query
  if (q.includes('system.columns') && q.includes('ORDER BY position')) {
    return [
      { name: 'event_date', type: 'Date', comment: 'Event date' },
      {
        name: 'tenant_id',
        type: 'UInt64',
        comment: 'Tenant identifier',
      },
      { name: 'event_name', type: 'String', comment: 'Event name' },
      { name: 'value', type: 'Float64', comment: 'Metric value' },
      { name: 'count', type: 'Int64', comment: 'Event count' },
    ]
  }

  // Default: return sample rows with mixed types for query_and_visualize
  if (q.includes('system.tables') && q.includes('total_bytes')) {
    return [
      { name: 'events', total_rows: 1000, total_bytes: 5000000 },
      { name: 'users', total_rows: 500, total_bytes: 2000000 },
    ]
  }

  // count-only query
  if (q.includes('count()') && !q.includes('countDistinct')) {
    return [{ count: 42 }]
  }

  // Generic rows for visualization
  return [
    {
      event_date: '2026-05-30',
      tenant_id: 1,
      event_name: 'click',
      value: 3.14,
    },
    {
      event_date: '2026-05-29',
      tenant_id: 2,
      event_name: 'view',
      value: 2.71,
    },
  ]
}

const readOnlyQuery = mock(async ({ query }: { query: string }) =>
  routeQuery(query)
)
const validatedReadOnlyQuery = mock(async ({ sql }: { sql: string }) =>
  routeQuery(sql)
)

mock.module('../helpers', () => ({
  hostIdSchema: z.number().int().min(0).optional(),
  resolveHostId: (a: number | undefined, b: number) => a ?? b,
  readOnlyQuery,
  validatedReadOnlyQuery,
}))

const { createVisualizationTools } = await import('../visualization-tools')

describe('createVisualizationTools', () => {
  test('creates both visualization tools', () => {
    const tools = createVisualizationTools(0)
    expect(tools.query_and_visualize).toBeDefined()
    expect(tools.discover_data_sources).toBeDefined()
  })

  describe('query_and_visualize', () => {
    test('returns visualization config with auto-detected dimensions', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT event_date, tenant_id, event_name, value FROM analytics.events LIMIT 10',
      })

      expect(result.type).toBe('visualization')
      expect(result.rowCount).toBe(2)
      expect(result.columns).toEqual([
        'event_date',
        'tenant_id',
        'event_name',
        'value',
      ])
      expect(result.viz.xKey).toBe('event_date') // first string column
      expect(result.viz.yKeys).toContain('value') // numeric column
      expect(result.viz.chartType).toBe('bar')
    })

    test('uses provided title and chartType', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT count() FROM analytics.events',
        title: 'Total Events',
        chartType: 'number',
      })

      expect(result.title).toBe('Total Events')
      expect(result.viz.chartType).toBe('number')
    })

    test('auto-detects number chart for single-row single-metric result', async () => {
      // Single row with string xKey + numeric yKey → auto-detects 'number'
      const origImpl = validatedReadOnlyQuery.getMockImplementation()
      validatedReadOnlyQuery.mockImplementation(async () => [
        { metric: 'total', cnt: 42 },
      ])

      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT metric, count() as cnt FROM analytics.events',
      })

      validatedReadOnlyQuery.mockImplementation(origImpl!)

      expect(result.rowCount).toBe(1)
      expect(result.viz.yKeys).toHaveLength(1)
      expect(result.viz.chartType).toBe('number')
    })

    test('passes through sortBy, sortOrder, readable options', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT event_date, value FROM analytics.events',
        sortBy: 'value',
        sortOrder: 'desc',
        readable: 'bytes',
      })

      expect(result.viz.sortBy).toBe('value')
      expect(result.viz.sortOrder).toBe('desc')
      expect(result.viz.readable).toBe('bytes')
    })

    test('uses sql slice as title when no title provided', async () => {
      const tools = createVisualizationTools(0)

      const sql = 'SELECT * FROM system.tables WHERE total_bytes > 1000000'
      const result = await tools.query_and_visualize.execute({ sql })

      expect(result.title).toBe(sql.slice(0, 60))
    })

    test('uses provided xKey and yKeys when specified', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT event_date, value FROM analytics.events',
        xKey: 'event_date',
        yKeys: ['value'],
      })

      expect(result.viz.xKey).toBe('event_date')
      expect(result.viz.yKeys).toEqual(['value'])
    })

    test('falls back to all non-xKey columns when no numeric yKeys found', async () => {
      // Rows with only string values (no numeric columns)
      const origImpl = validatedReadOnlyQuery.getMockImplementation()
      validatedReadOnlyQuery.mockImplementation(async () => [
        { event_date: '2026-05-30', event_name: 'click' },
        { event_date: '2026-05-29', event_name: 'view' },
      ])

      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT event_date, event_name FROM analytics.events',
        xKey: 'event_date',
      })

      validatedReadOnlyQuery.mockImplementation(origImpl!)

      expect(result.viz.yKeys).toEqual(['event_name'])
    })

    test('does not include sortBy/sortOrder/readable when not provided', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.query_and_visualize.execute({
        sql: 'SELECT count() FROM analytics.events',
      })

      expect(result.viz.sortBy).toBeUndefined()
      expect(result.viz.sortOrder).toBeUndefined()
      expect(result.viz.readable).toBeUndefined()
    })
  })

  describe('discover_data_sources', () => {
    test('returns sources with column classification', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.discover_data_sources.execute({
        searchTerm: 'event',
      })

      expect(result.type).toBe('data_sources')
      expect(result.searchTerm).toBe('event')
      expect(result.sources).toHaveLength(1)

      const source = result.sources[0]
      expect(source.database).toBe('analytics')
      expect(source.table).toBe('events')
      expect(source.engine).toBe('MergeTree')
      expect(source.totalRows).toBe(1000000)

      // Column classification
      expect(source.matchedColumns.length).toBeGreaterThan(0)
      expect(source.measures.length).toBeGreaterThan(0)
      expect(source.dimensions.length).toBeGreaterThan(0)
    })

    test('returns empty sources when no tables match', async () => {
      const origImpl = readOnlyQuery.getMockImplementation()
      readOnlyQuery.mockImplementation(async () => [])

      const tools = createVisualizationTools(0)
      const result = await tools.discover_data_sources.execute({
        searchTerm: 'nonexistent_table_xyz',
      })

      readOnlyQuery.mockImplementation(origImpl!)

      expect(result.type).toBe('data_sources')
      expect(result.sources).toHaveLength(0)
    })

    test('passes database filter via query_params', async () => {
      let capturedParams: Record<string, unknown> | undefined
      const origImpl = readOnlyQuery.getMockImplementation()
      readOnlyQuery.mockImplementation(
        async (opts: {
          query: string
          query_params?: Record<string, unknown>
        }) => {
          if (opts.query.includes('matched_tables')) {
            capturedParams = opts.query_params
          }
          return origImpl!(opts)
        }
      )

      const tools = createVisualizationTools(0)

      await tools.discover_data_sources.execute({
        searchTerm: 'event',
        database: 'analytics',
      })

      readOnlyQuery.mockImplementation(origImpl!)

      expect(capturedParams).toBeDefined()
      expect(capturedParams!.database).toBe('analytics')
    })

    test('classifies columns into measures and dimensions correctly', async () => {
      const tools = createVisualizationTools(0)

      const result = await tools.discover_data_sources.execute({
        searchTerm: 'event',
      })

      const source = result.sources[0]

      const measureNames = source.measures.map((c: { name: string }) => c.name)
      expect(measureNames).toContain('tenant_id')
      expect(measureNames).toContain('value')
      expect(measureNames).toContain('count')

      const dimensionNames = source.dimensions.map(
        (c: { name: string }) => c.name
      )
      expect(dimensionNames).toContain('event_date')
      expect(dimensionNames).toContain('event_name')
    })
  })
})
