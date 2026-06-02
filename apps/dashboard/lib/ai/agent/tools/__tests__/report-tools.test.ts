import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

function setupReportMocks(throwOn: string | null = null) {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (throwOn && query.includes(throwOn))
      throw new Error(`${throwOn} query failed`)
    if (query.includes('version()'))
      return { data: queryStore.server ?? [], error: null }
    if (query.includes('system.disks'))
      return { data: queryStore.disks ?? [], error: null }
    if (query.includes('system.tables'))
      return { data: queryStore.tables ?? [], error: null }
    if (query.includes('system.query_log'))
      return { data: queryStore.slow ?? [], error: null }
    if (query.includes('system.errors'))
      return { data: queryStore.errors ?? [], error: null }
    if (query.includes('system.merges'))
      return { data: queryStore.merges ?? [], error: null }
    if (query.includes('system.replicas'))
      return { data: queryStore.replicas ?? [], error: null }
    return { data: [], error: null }
  })
}

const { createReportTools } = await import('../report-tools')

describe('createReportTools', () => {
  test('creates generate_health_report tool', () => {
    const tools = createReportTools(0)
    expect(tools.generate_health_report).toBeDefined()
  })

  test('collects full health report', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.server = [{ version: '24.1.1', uptime_seconds: 86400 }]
    queryStore.disks = [
      { name: 'default', free_space: '100 GiB', total_space: '500 GiB' },
    ]
    queryStore.tables = [
      { database: 'db', name: 'events', total_bytes: '10 GiB' },
    ]
    queryStore.slow = [{ query_id: 'q1', query_duration_ms: 5000 }]
    queryStore.errors = [{ name: 'Err1', code: 100, count: 5 }]
    queryStore.merges = [{ active_merges: 2, total_size: '5 GiB' }]
    queryStore.replicas = []
    setupReportMocks()

    const tools = createReportTools(0)
    const result = await tools.generate_health_report.execute({})

    expect(result.collected_at).toBeDefined()
    expect(result.time_window_hours).toBe(24)
    expect(result.server).toEqual([
      { version: '24.1.1', uptime_seconds: 86400 },
    ])
    expect(result.disks).toEqual([
      { name: 'default', free_space: '100 GiB', total_space: '500 GiB' },
    ])
    expect(result.top_tables).toEqual([
      { database: 'db', name: 'events', total_bytes: '10 GiB' },
    ])
    expect(result.slow_queries).toEqual([
      { query_id: 'q1', query_duration_ms: 5000 },
    ])
    expect(result.errors).toEqual([{ name: 'Err1', code: 100, count: 5 }])
    expect(result.merge_status).toEqual([
      { active_merges: 2, total_size: '5 GiB' },
    ])
    expect(result.replication_issues).toEqual([])
    expect(result.instructions).toContain('health report')
  })

  test('uses custom lastHours', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.server = [{ version: '24.1.1', uptime_seconds: 100 }]
    setupReportMocks()

    const tools = createReportTools(0)
    const result = await tools.generate_health_report.execute({ lastHours: 48 })

    expect(result.time_window_hours).toBe(48)
  })

  test('handles individual query failures gracefully', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupReportMocks('system.disks')

    const tools = createReportTools(0)
    const result = await tools.generate_health_report.execute({})

    expect(result.disks).toEqual({ error: 'system.disks query failed' })
    expect(result.server).toEqual([])
  })

  test('resolves hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupReportMocks()

    const tools = createReportTools(0)
    const result = await tools.generate_health_report.execute({ hostId: 3 })

    expect(result.time_window_hours).toBe(24)
  })
})
