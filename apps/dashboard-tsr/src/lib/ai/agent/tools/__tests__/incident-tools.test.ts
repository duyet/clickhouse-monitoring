import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

function setupIncidentMocks() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('system.processes'))
      return { data: queryStore.processes ?? [], error: null }
    if (query.includes('system.query_log') && query.includes('toStartOfMinute'))
      return { data: queryStore.query_timeline ?? [], error: null }
    if (query.includes('system.query_log') && query.includes('exception_code'))
      return { data: queryStore.top_errors ?? [], error: null }
    if (query.includes('system.query_log') && query.includes('query_kind'))
      return { data: queryStore.ddl ?? [], error: null }
    if (query.includes('system.merges'))
      return { data: queryStore.merges ?? [], error: null }
    if (query.includes('system.errors'))
      return { data: queryStore.errors ?? [], error: null }
    if (query.includes('system.replicas'))
      return { data: queryStore.replicas ?? [], error: null }
    if (query.includes('system.replication_queue'))
      return { data: queryStore.replication_queue ?? [], error: null }
    if (query.includes('system.zookeeper'))
      return { data: queryStore.zookeeper ?? [], error: null }
    if (query.includes('system.metrics'))
      return { data: queryStore.metrics ?? [], error: null }
    if (query.includes('system.text_log'))
      return { data: queryStore.text_log ?? [], error: null }
    if (query.includes('system.parts'))
      return { data: queryStore.parts ?? [], error: null }
    if (query.includes('system.mutations'))
      return { data: queryStore.mutations ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createIncidentTools } = await import('../incident-tools')

describe('createIncidentTools', () => {
  test('creates investigate_incident tool', () => {
    const tools = createIncidentTools(0)
    expect(tools.investigate_incident).toBeDefined()
  })

  test('investigates slow_queries symptom', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.processes = [{ query_id: 'q1', elapsed: 30 }]
    queryStore.query_timeline = [{ minute: '2024-01-01', count: 5 }]
    queryStore.merges = [{ active_merges: 3 }]
    queryStore.metrics = [{ metric: 'Query', value: 10 }]
    queryStore.ddl = []
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'slow_queries',
    })

    expect(result.investigation).toBe('Slow Query Investigation')
    expect(result.symptom).toBe('slow_queries')
    expect(result.time_window).toBe('1 HOUR')
    expect(result.findings.current_slow).toEqual([
      { query_id: 'q1', elapsed: 30 },
    ])
    expect(result.instructions).toBeDefined()
  })

  test('investigates high_errors symptom', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.query_timeline = [{ minute: '2024-01-01', errors: 10 }]
    queryStore.top_errors = [
      { exception_code: 50, count: 5, sample_message: 'err' },
    ]
    queryStore.errors = [{ name: 'UNKNOWN', code: 50, value: 10 }]
    queryStore.metrics = []
    queryStore.ddl = []
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'high_errors',
    })

    expect(result.investigation).toBe('Error Spike Investigation')
    expect(result.findings).toBeDefined()
  })

  test('investigates replication_lag symptom', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.replicas = [
      { database: 'db', table: 'tbl', absolute_delay: 120 },
    ]
    queryStore.replication_queue = []
    queryStore.zookeeper = [{ zk_nodes: 5 }]
    queryStore.metrics = []
    queryStore.ddl = []
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'replication_lag',
    })

    expect(result.investigation).toBe('Replication Lag Investigation')
  })

  test('investigates high_memory symptom', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.processes = [{ query_id: 'q1', memory_usage: 1000000 }]
    queryStore.metrics = [{ metric: 'MemoryTracking', value: 5000000 }]
    queryStore.text_log = []
    queryStore.ddl = []
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'high_memory',
    })

    expect(result.investigation).toBe('Memory Pressure Investigation')
  })

  test('investigates too_many_parts symptom', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.parts = [{ database: 'db', table: 'tbl', parts: 500 }]
    queryStore.mutations = []
    queryStore.merges = [{ active_merges: 2 }]
    queryStore.metrics = []
    queryStore.ddl = []
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'too_many_parts',
    })

    expect(result.investigation).toBe('Too Many Parts Investigation')
  })

  test('custom since interval is sanitized', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.metrics = []
    queryStore.ddl = []
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'slow_queries',
      since: '2 HOUR',
    })

    expect(result.time_window).toBe('2 HOUR')
  })

  test('rejects invalid since interval', async () => {
    setupIncidentMocks()

    const tools = createIncidentTools(0)
    const result = await tools.investigate_incident.execute({
      symptom: 'slow_queries',
      since: 'DROP TABLE; --',
    })

    expect(result.error).toContain('Invalid interval')
  })
})
