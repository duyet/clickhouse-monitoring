import { mockFetchData } from './shared-mocks'
import { describe, expect, type mock, test } from 'bun:test'

const queryResults: Record<string, unknown[]> = {
  running: [
    {
      query_id: 'abc-123',
      user: 'analyst',
      elapsed: 12.5,
      read_rows: 5000000,
      memory_usage: 104857600,
      query: 'SELECT * FROM analytics.events WHERE event_date = today()',
    },
  ],
  slow: [
    {
      query_id: 'slow-1',
      user: 'admin',
      query_duration_ms: 30000,
      read_rows: 100000000,
      memory_usage: 536870912,
      query: 'SELECT count() FROM analytics.events GROUP BY status',
      event_time: '2026-05-30 10:00:00',
    },
  ],
  failed: [
    {
      query_id: 'fail-1',
      user: 'dev',
      exception_code: 47,
      error: 'Missing column: nonexistent_col',
      query_duration_ms: 50,
      event_time: '2026-05-30 09:30:00',
      query: 'SELECT nonexistent_col FROM analytics.events',
    },
  ],
  expensive: [
    {
      query_id: 'exp-1',
      user: 'analyst',
      query_duration_ms: 25000,
      read_rows: 200000000,
      read_bytes: 10737418240,
      memory_usage: 805306368,
      query: 'SELECT status, count() FROM analytics.events GROUP BY status',
      event_time: '2026-05-30 08:00:00',
    },
  ],
  patterns: [
    {
      normalized_query_hash: 'hash123',
      sample_query: 'SELECT count() FROM analytics.events WHERE tenant_id = ?',
      count: 150,
      avg_duration_ms: 500,
      max_duration_ms: 3000,
      total_read_rows: 1500000000,
      total_read_bytes: 50000000000,
    },
  ],
  explain: [
    { explain: 'ExpressionProjection: Transformated output' },
    { explain: '  MergeTree InOrder' },
  ],
}

function setupQueryMock() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    const q = query

    if (q.includes('system.processes'))
      return { data: queryResults.running, error: null }
    if (
      q.includes('QueryFinish') &&
      q.includes('query_duration_ms') &&
      !q.includes('read_bytes')
    )
      return { data: queryResults.slow, error: null }
    if (q.includes('ExceptionWhileProcessing'))
      return { data: queryResults.failed, error: null }
    if (
      q.includes('read_bytes') &&
      q.includes('memory_usage') &&
      !q.includes('normalized_query_hash')
    )
      return { data: queryResults.expensive, error: null }
    if (q.includes('normalized_query_hash'))
      return { data: queryResults.patterns, error: null }
    if (q.includes('EXPLAIN'))
      return { data: queryResults.explain, error: null }

    return { data: [], error: null }
  })
}

const { createQueryTools } = await import('../query-tools')

describe('createQueryTools', () => {
  test('creates all six query tools', () => {
    const tools = createQueryTools(0)
    expect(tools.get_running_queries).toBeDefined()
    expect(tools.get_slow_queries).toBeDefined()
    expect(tools.get_failed_queries).toBeDefined()
    expect(tools.get_expensive_queries).toBeDefined()
    expect(tools.get_query_patterns).toBeDefined()
    expect(tools.explain_query).toBeDefined()
  })

  describe('get_running_queries', () => {
    test('returns currently running queries', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_running_queries.execute({})

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0].query_id).toBe('abc-123')
      expect(result[0].user).toBe('analyst')
    })
  })

  describe('get_slow_queries', () => {
    test('returns slow queries with default limit', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_slow_queries.execute({})

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].query_duration_ms).toBe(30000)
    })

    test('passes custom limit', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_slow_queries.execute({ limit: 5 })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_failed_queries', () => {
    test('returns failed queries with default params', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_failed_queries.execute({})

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].error).toContain('Missing column')
      expect(result[0].exception_code).toBe(47)
    })

    test('accepts custom limit and lastHours', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_failed_queries.execute({
        limit: 5,
        lastHours: 48,
      })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_expensive_queries', () => {
    test('returns queries sorted by memory', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_expensive_queries.execute({
        sortBy: 'memory',
      })

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].memory_usage).toBe(805306368)
    })

    test('returns queries sorted by read_bytes', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_expensive_queries.execute({
        sortBy: 'read_bytes',
      })

      expect(Array.isArray(result)).toBe(true)
    })

    test('returns queries sorted by duration', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_expensive_queries.execute({
        sortBy: 'duration',
      })

      expect(Array.isArray(result)).toBe(true)
    })

    test('accepts custom limit and lastHours', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_expensive_queries.execute({
        sortBy: 'memory',
        limit: 5,
        lastHours: 12,
      })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('get_query_patterns', () => {
    test('returns aggregated query fingerprints', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_query_patterns.execute({})

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].normalized_query_hash).toBe('hash123')
      expect(result[0].count).toBe(150)
      expect(result[0].avg_duration_ms).toBe(500)
    })

    test('accepts custom params', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.get_query_patterns.execute({
        limit: 10,
        lastHours: 48,
        minCount: 5,
      })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('explain_query', () => {
    test('returns execution plan with default type', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.explain_query.execute({
        sql: 'SELECT count() FROM system.tables',
      })

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].explain).toBeDefined()
    })

    test('supports pipeline explain type', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.explain_query.execute({
        sql: 'SELECT count() FROM system.tables',
        type: 'pipeline',
      })

      expect(Array.isArray(result)).toBe(true)
    })

    test('supports indexes explain type', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const result = await tools.explain_query.execute({
        sql: 'SELECT count() FROM system.tables',
        type: 'indexes',
      })

      expect(Array.isArray(result)).toBe(true)
    })

    test('propagates validation errors', async () => {
      setupQueryMock()

      const tools = createQueryTools(0)
      const { validateSqlQuery } = await import('@chm/sql-builder')

      ;(validateSqlQuery as ReturnType<typeof mock>).mockImplementationOnce(
        () => {
          throw new Error('SQL validation failed: dangerous query')
        }
      )

      expect(
        tools.explain_query.execute({ sql: 'DROP TABLE system.tables' })
      ).rejects.toThrow('SQL validation failed')
    })
  })
})
