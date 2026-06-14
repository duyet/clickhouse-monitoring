import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

const { createClusterTools } = await import('../cluster-tools')

describe('createClusterTools', () => {
  test('creates get_clusters and get_distributed_ddl_queue tools', () => {
    const tools = createClusterTools(0) as any
    expect(tools.get_clusters).toBeDefined()
    expect(tools.get_distributed_ddl_queue).toBeDefined()
  })

  test('get_clusters returns cluster topology', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.clusters = [
      {
        cluster: 'prod_cluster',
        shard_num: 1,
        replica_num: 1,
        host_name: 'ch-node-1',
        host_address: '10.0.0.1',
        port: 9000,
        is_local: 1,
      },
      {
        cluster: 'prod_cluster',
        shard_num: 1,
        replica_num: 2,
        host_name: 'ch-node-2',
        host_address: '10.0.0.2',
        port: 9000,
        is_local: 0,
      },
    ]

    mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes('system.clusters'))
        return { data: queryStore.clusters ?? [], error: null }
      if (query.includes('system.distributed_ddl_queue'))
        return { data: queryStore.ddl_queue ?? [], error: null }
      return { data: [], error: null }
    })

    const tools = createClusterTools(0) as any
    const result = await tools.get_clusters.execute({})

    expect(result).toHaveLength(2)
    expect(result[0].cluster).toBe('prod_cluster')
    expect(result[1].host_address).toBe('10.0.0.2')
  })

  test('get_clusters returns empty when no clusters', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])

    mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes('system.clusters'))
        return { data: queryStore.clusters ?? [], error: null }
      if (query.includes('system.distributed_ddl_queue'))
        return { data: queryStore.ddl_queue ?? [], error: null }
      return { data: [], error: null }
    })

    const tools = createClusterTools(0) as any
    const result = await tools.get_clusters.execute({})

    expect(result).toEqual([])
  })

  test('get_distributed_ddl_queue returns pending DDL ops', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.ddl_queue = [
      {
        entry: 1,
        host_name: 'node1',
        status: 'Finished',
        cluster: 'prod',
        query: 'CREATE TABLE test (id UInt64) ENGINE = MergeTree ORDER BY id',
      },
    ]

    mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes('system.clusters'))
        return { data: queryStore.clusters ?? [], error: null }
      if (query.includes('system.distributed_ddl_queue'))
        return { data: queryStore.ddl_queue ?? [], error: null }
      return { data: [], error: null }
    })

    const tools = createClusterTools(0) as any
    const result = await tools.get_distributed_ddl_queue.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('Finished')
  })

  test('get_distributed_ddl_queue uses default limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.ddl_queue = [{ entry: 1 }]

    mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes('system.clusters'))
        return { data: queryStore.clusters ?? [], error: null }
      if (query.includes('system.distributed_ddl_queue'))
        return { data: queryStore.ddl_queue ?? [], error: null }
      return { data: [], error: null }
    })

    const tools = createClusterTools(0) as any
    const result = await tools.get_distributed_ddl_queue.execute({})

    expect(result).toHaveLength(1)
  })

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])

    mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
      if (query.includes('system.clusters'))
        return { data: queryStore.clusters ?? [], error: null }
      if (query.includes('system.distributed_ddl_queue'))
        return { data: queryStore.ddl_queue ?? [], error: null }
      return { data: [], error: null }
    })

    const tools = createClusterTools(0) as any
    const result = await tools.get_clusters.execute({ hostId: 3 })
    expect(Array.isArray(result)).toBe(true)
  })
})
