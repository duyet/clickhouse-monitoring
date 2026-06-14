import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

function setupMergeMocks() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('system.merges') && !query.includes('part_log'))
      return { data: queryStore.merges ?? [], error: null }
    if (query.includes('system.mutations'))
      return { data: queryStore.mutations ?? [], error: null }
    if (query.includes('system.part_log'))
      return { data: queryStore.part_log ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createMergeTools } = await import('../merge-tools')

describe('createMergeTools', () => {
  test('creates all merge tools', () => {
    const tools = createMergeTools(0) as any
    expect(tools.get_merge_status).toBeDefined()
    expect(tools.get_mutations).toBeDefined()
    expect(tools.get_merge_performance).toBeDefined()
  })

  test('get_merge_status returns active merges', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.merges = [
      {
        database: 'db',
        table: 'tbl',
        progress_pct: 45.5,
        size: '1 GiB',
        elapsed: 10.2,
      },
    ]
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_merge_status.execute({})

    expect(result).toEqual([
      {
        database: 'db',
        table: 'tbl',
        progress_pct: 45.5,
        size: '1 GiB',
        elapsed: 10.2,
      },
    ])
  })

  test('get_merge_status returns empty when no merges', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_merge_status.execute({})

    expect(result).toEqual([])
  })

  test('get_mutations returns all mutations by default', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.mutations = [
      {
        database: 'db',
        table: 'tbl',
        mutation_id: 'm1',
        command: 'UPDATE x=1',
        is_done: 0,
      },
      {
        database: 'db',
        table: 'tbl',
        mutation_id: 'm2',
        command: 'DELETE WHERE x=0',
        is_done: 1,
      },
    ]
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_mutations.execute({})

    expect(result).toHaveLength(2)
  })

  test('get_mutations filters by database', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.mutations = [{ database: 'analytics', mutation_id: 'm1' }]
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_mutations.execute({ database: 'analytics' })

    expect(result).toHaveLength(1)
  })

  test('get_mutations filters by isDone', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.mutations = [{ mutation_id: 'm1', is_done: 1 }]
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_mutations.execute({ isDone: true })

    expect(result).toHaveLength(1)
  })

  test('get_mutations respects custom limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.mutations = [{ mutation_id: 'm1' }]
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_mutations.execute({ limit: 10 })

    expect(result).toHaveLength(1)
  })

  test('get_merge_performance returns part_log data', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.part_log = [
      {
        hour: '2024-01-01',
        merge_count: 5,
        total_rows: 100000,
        avg_duration_sec: 2.5,
      },
    ]
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_merge_performance.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].merge_count).toBe(5)
  })

  test('get_merge_performance respects custom lastHours', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.part_log = []
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_merge_performance.execute({ lastHours: 48 })

    expect(result).toEqual([])
  })

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_merge_status.execute({ hostId: 2 })
    expect(Array.isArray(result)).toBe(true)
  })
})
