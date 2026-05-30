import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown> = {}

function setupOptimizerMock() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.startsWith('EXPLAIN PLAN'))
      return {
        data: queryStore.plan ?? [{ explain: 'plan ok' }],
        error: null,
      }
    if (query.startsWith('EXPLAIN INDEXES'))
      return { data: queryStore.indexes ?? [], error: null }
    if (query.includes('system.tables'))
      return { data: queryStore.schema ?? [], error: null }
    if (query.includes('system.data_skipping_indices'))
      return { data: queryStore.skip_indexes ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createOptimizerTools } = await import('../optimizer-tools')

describe('createOptimizerTools', () => {
  test('creates analyze_query_optimization tool', () => {
    const tools = createOptimizerTools(0)
    expect(tools.analyze_query_optimization).toBeDefined()
  })

  test('returns query optimization analysis', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.plan = [{ explain: 'Full scan on events' }]
    queryStore.indexes = [{ index: 'none' }]
    queryStore.schema = [
      {
        engine: 'MergeTree',
        sorting_key: 'date',
        primary_key: 'date',
        partition_key: 'toYYYYMM(date)',
      },
    ]
    queryStore.skip_indexes = [
      { name: 'idx1', type_full: 'minmax', granularity: 8192 },
    ]
    setupOptimizerMock()

    const tools = createOptimizerTools(0)
    const result = await tools.analyze_query_optimization.execute({
      sql: 'SELECT * FROM events WHERE date = today()',
    })

    expect(result.type).toBe('query_optimization')
    expect(result.sql).toBe('SELECT * FROM events WHERE date = today()')
    expect(result.explain_plan).toEqual([{ explain: 'Full scan on events' }])
    expect(result.explain_indexes).toEqual([{ index: 'none' }])
    expect(result.tables).toHaveLength(1)
    expect(result.tables[0].table).toBe('default.events')
    expect(result.tables[0].schema).toEqual([
      {
        engine: 'MergeTree',
        sorting_key: 'date',
        primary_key: 'date',
        partition_key: 'toYYYYMM(date)',
      },
    ])
    expect(result.tables[0].skipIndexes).toEqual([
      { name: 'idx1', type_full: 'minmax', granularity: 8192 },
    ])
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  test('uses provided database context', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.plan = []
    queryStore.indexes = []
    queryStore.schema = []
    setupOptimizerMock()

    const tools = createOptimizerTools(0)
    const result = await tools.analyze_query_optimization.execute({
      sql: 'SELECT 1 FROM events',
      database: 'analytics',
    })

    expect(result.tables[0].table).toBe('analytics.events')
  })

  test('resolves hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.plan = []
    queryStore.indexes = []
    queryStore.schema = []
    setupOptimizerMock()

    const tools = createOptimizerTools(0)
    const result = await tools.analyze_query_optimization.execute({
      sql: 'SELECT 1',
      hostId: 5,
    })

    expect(result.type).toBe('query_optimization')
  })

  test('includes optimization suggestions', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.plan = []
    queryStore.indexes = []
    queryStore.schema = []
    setupOptimizerMock()

    const tools = createOptimizerTools(0)
    const result = await tools.analyze_query_optimization.execute({
      sql: 'SELECT 1',
    })

    expect(result.suggestions).toContain(
      'Check if WHERE clause columns align with the sorting key (leftmost columns)'
    )
    expect(result.suggestions).toContain(
      'For repeated query patterns, consider a materialized view'
    )
  })
})
