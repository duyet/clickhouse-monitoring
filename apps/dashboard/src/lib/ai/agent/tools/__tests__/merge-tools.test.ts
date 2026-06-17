import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

function setupMergeMocks() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('system.merges'))
      return { data: queryStore.merges ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createMergeTools } = await import('../merge-tools')

describe('createMergeTools', () => {
  test('creates merge tools', () => {
    const tools = createMergeTools(0) as any
    expect(tools.get_merge_status).toBeDefined()
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

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupMergeMocks()

    const tools = createMergeTools(0) as any
    const result = await tools.get_merge_status.execute({ hostId: 2 })
    expect(Array.isArray(result)).toBe(true)
  })
})
