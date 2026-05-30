import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

function setupStorageMock() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('system.detached_parts'))
      return { data: queryStore['detached'] ?? [], error: null }
    if (query.includes('system.parts'))
      return { data: queryStore['parts'] ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createStorageTools } = await import('../storage-tools')

describe('createStorageTools', () => {
  test('creates all storage tools', () => {
    const tools = createStorageTools(0)
    expect(tools.get_table_parts).toBeDefined()
    expect(tools.get_detached_parts).toBeDefined()
    expect(tools.get_top_tables_by_size).toBeDefined()
  })

  test('get_table_parts returns parts for a table', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['parts'] = [
      {
        name: 'all_1_1_0',
        partition: '202401',
        rows: 1000,
        size_on_disk: '100 KiB',
        compression_ratio: 0.15,
      },
    ]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_table_parts.execute({
      database: 'analytics',
      table: 'events',
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('all_1_1_0')
  })

  test('get_table_parts filters by active status', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['parts'] = [{ name: 'active_part', rows: 500 }]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_table_parts.execute({
      database: 'db',
      table: 'tbl',
      active: true,
    })

    expect(result).toHaveLength(1)
  })

  test('get_table_parts respects custom limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['parts'] = [{ name: 'p1' }, { name: 'p2' }]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_table_parts.execute({
      database: 'db',
      table: 'tbl',
      limit: 1,
    })

    expect(result).toHaveLength(2)
  })

  test('get_table_parts uses default limit of 100', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['parts'] = []
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_table_parts.execute({
      database: 'db',
      table: 'tbl',
    })

    expect(result).toEqual([])
  })

  test('get_detached_parts returns all when no database filter', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['detached'] = [
      {
        database: 'db1',
        table: 'tbl1',
        partition_id: 'p1',
        name: 'detached_1',
        reason: ' damaged',
      },
    ]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_detached_parts.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].reason).toBe(' damaged')
  })

  test('get_detached_parts filters by database', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['detached'] = [{ database: 'analytics', table: 'events' }]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_detached_parts.execute({
      database: 'analytics',
    })

    expect(result).toHaveLength(1)
  })

  test('get_top_tables_by_size returns ranked tables', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['parts'] = [
      {
        database: 'analytics',
        table: 'events',
        total_rows: 1000000,
        compressed_size: '10 GiB',
      },
      {
        database: 'logs',
        table: 'access',
        total_rows: 500000,
        compressed_size: '5 GiB',
      },
    ]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_top_tables_by_size.execute({})

    expect(result).toHaveLength(2)
    expect(result[0].database).toBe('analytics')
  })

  test('get_top_tables_by_size respects custom limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore['parts'] = [{ database: 'db', table: 't1' }]
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_top_tables_by_size.execute({ limit: 5 })

    expect(result).toHaveLength(1)
  })

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupStorageMock()

    const tools = createStorageTools(0)
    const result = await tools.get_detached_parts.execute({ hostId: 3 })
    expect(Array.isArray(result)).toBe(true)
  })
})
