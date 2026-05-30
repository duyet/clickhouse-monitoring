import { mockFetchData } from './shared-mocks'
import { describe, expect, test } from 'bun:test'

const queryStore: Record<string, unknown[]> = {}

const { createHealthTools } = await import('../health-tools')

function setupHealthMock() {
  mockFetchData.mockImplementation(async ({ query }: { query: string }) => {
    if (query.includes('version()'))
      return { data: queryStore.version ?? [], error: null }
    if (query.includes('uptime()'))
      return { data: queryStore.uptime ?? [], error: null }
    if (query.includes('system.metrics'))
      return { data: queryStore.metrics ?? [], error: null }
    if (query.includes('system.asynchronous_metrics'))
      return { data: queryStore.async_metrics ?? [], error: null }
    if (query.includes('system.disks'))
      return { data: queryStore.disks ?? [], error: null }
    if (query.includes('system.errors'))
      return { data: queryStore.errors ?? [], error: null }
    if (query.includes('system.crash_log'))
      return { data: queryStore.crash ?? [], error: null }
    return { data: [], error: null }
  })
}

describe('createHealthTools', () => {
  test('creates all health tools', () => {
    const tools = createHealthTools(0)
    expect(tools.get_metrics).toBeDefined()
    expect(tools.get_system_resources).toBeDefined()
    expect(tools.get_disk_usage).toBeDefined()
    expect(tools.get_errors).toBeDefined()
    expect(tools.get_crash_log).toBeDefined()
  })

  test('get_metrics returns version, uptime, and connection metrics', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.version = [{ version: '24.1.1' }]
    queryStore.uptime = [{ uptime_seconds: 86400 }]
    queryStore.metrics = [
      { metric: 'TCPConnection', value: 5 },
      { metric: 'HTTPConnection', value: 10 },
      { metric: 'MemoryTracking', value: 1000000 },
    ]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_metrics.execute({})

    expect(result.version).toBe('24.1.1')
    expect(result.uptime_seconds).toBe(86400)
    expect(result.TCPConnection).toBe(5)
    expect(result.HTTPConnection).toBe(10)
    expect(result.MemoryTracking).toBe(1000000)
  })

  test('get_metrics handles empty data', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_metrics.execute({})

    expect(result.version).toBeUndefined()
    expect(result.uptime_seconds).toBeUndefined()
  })

  test('get_system_resources returns metrics and async_metrics', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.metrics = [{ metric: 'MemoryTracking', value: 100 }]
    queryStore.async_metrics = [
      { metric: 'LoadAverage1', value: 2.5 },
      { metric: 'OSMemoryTotal', value: 32000000000 },
    ]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_system_resources.execute({})

    expect(result.metrics).toEqual([{ metric: 'MemoryTracking', value: 100 }])
    expect(result.async_metrics).toEqual([
      { metric: 'LoadAverage1', value: 2.5 },
      { metric: 'OSMemoryTotal', value: 32000000000 },
    ])
  })

  test('get_disk_usage returns disk data', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.disks = [
      {
        name: 'default',
        path: '/var/lib/clickhouse',
        free: '400 GiB',
        total: '500 GiB',
        free_pct: 80,
      },
    ]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_disk_usage.execute({})

    expect(result).toEqual([
      {
        name: 'default',
        path: '/var/lib/clickhouse',
        free: '400 GiB',
        total: '500 GiB',
        free_pct: 80,
      },
    ])
  })

  test('get_errors returns error data with default limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.errors = [
      {
        name: 'UNKNOWN',
        code: 50,
        count: 10,
        last_message: 'something broke',
      },
    ]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_errors.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('UNKNOWN')
  })

  test('get_crash_log returns crash data with default limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.crash = [
      { event_time: '2024-01-01', signal: 11, thread_id: 1, trace: 'stack...' },
    ]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_crash_log.execute({})

    expect(result).toHaveLength(1)
    expect(result[0].signal).toBe(11)
  })

  test('get_errors respects custom limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.errors = [{ name: 'E1' }, { name: 'E2' }]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_errors.execute({ limit: 1 })

    expect(result).toHaveLength(2)
  })

  test('get_crash_log respects custom limit', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    queryStore.crash = [{ event_time: '2024-01-01' }]
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_crash_log.execute({ limit: 5 })

    expect(result).toHaveLength(1)
  })

  test('tools resolve hostId override', async () => {
    Object.keys(queryStore).forEach((k) => delete queryStore[k])
    setupHealthMock()

    const tools = createHealthTools(0)
    const result = await tools.get_disk_usage.execute({ hostId: 3 })
    expect(Array.isArray(result)).toBe(true)
  })
})
