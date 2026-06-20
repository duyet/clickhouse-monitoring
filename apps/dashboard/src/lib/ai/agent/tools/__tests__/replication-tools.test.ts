import { mockFetchData } from './shared-mocks'
import { beforeEach, describe, expect, test } from 'bun:test'

const { createReplicationTools } = await import('../replication-tools')

/**
 * Captures the params passed to the (mocked) fetchData so we can assert on the
 * query, query_params, and resolved hostId without a live ClickHouse.
 */
function captureFetch(rows: unknown[] = []) {
  const calls: Array<Record<string, unknown>> = []
  mockFetchData.mockImplementation(async (params: Record<string, unknown>) => {
    calls.push(params)
    return { data: rows, error: null }
  })
  return calls
}

describe('createReplicationTools', () => {
  beforeEach(() => {
    mockFetchData.mockReset()
  })

  test('exposes get_replication_status', () => {
    const tools = createReplicationTools(0) as any
    expect(tools.get_replication_status).toBeDefined()
  })

  test('default call targets system.replicas with no database filter', async () => {
    const calls = captureFetch()
    const tools = createReplicationTools(0) as any
    await tools.get_replication_status.execute({})

    expect(calls).toHaveLength(1)
    expect(calls[0].query).toContain('system.replicas')
    expect(calls[0].query_params).toEqual({ database: '' })
  })

  test('passes the database filter through to query_params', async () => {
    const calls = captureFetch()
    const tools = createReplicationTools(0) as any
    await tools.get_replication_status.execute({ database: 'analytics' })

    expect(calls[0].query_params).toEqual({ database: 'analytics' })
  })

  test('uses the factory hostId when no override is given', async () => {
    const calls = captureFetch()
    const tools = createReplicationTools(3) as any
    await tools.get_replication_status.execute({})

    expect(calls[0].hostId).toBe(3)
  })

  test('routes to the hostId override when provided (not the factory host)', async () => {
    const calls = captureFetch()
    const tools = createReplicationTools(3) as any
    await tools.get_replication_status.execute({ hostId: 7 })

    expect(calls[0].hostId).toBe(7)
  })

  test('returns the raw rows from the query result', async () => {
    const rows = [
      { database: 'db', table: 't', absolute_delay: 5, queue_size: 2 },
    ]
    captureFetch(rows)
    const tools = createReplicationTools(0) as any
    const result = await tools.get_replication_status.execute({})

    expect(result).toEqual(rows)
  })
})
